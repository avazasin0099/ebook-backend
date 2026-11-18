import { Op } from 'sequelize';
import {
  sequelize,
  Order,
  OrderItem,
  Payment,
  Refund,
  BookPurchase,
  AuditLog,
} from '../../database/models';
import { cashfreeService } from '../../services/cashfree.service';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import logger from '../../utils/logger';

export class PaymentsService {
  public async handleWebhook(
    rawBody: string,
    timestamp: string,
    signature: string,
    payload: any
  ) {
    // 1. Verify HMAC-SHA256 Signature
    const isValid = cashfreeService.verifyWebhookSignature(rawBody, timestamp, signature);
    if (!isValid) {
      logger.warn('⚠️ Rejected Cashfree webhook due to invalid HMAC signature');
      throw new UnauthorizedError('Invalid webhook signature');
    }

    const eventType = payload.type;
    logger.info(`Cashfree Webhook received: ${eventType}`);

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = payload.data?.order?.order_id;
      const cfPaymentId = String(payload.data?.payment?.cf_payment_id);
      const paymentAmount = payload.data?.payment?.payment_amount;
      const paymentMethod = payload.data?.payment?.payment_group || 'ONLINE';

      await this.fulfillPaidOrder({
        orderId,
        cfPaymentId,
        amount: paymentAmount,
        paymentMethod,
        rawPayload: payload,
      });
    }

    return { received: true };
  }

  public async verifyAndSyncOrder(orderId: string, userId?: string) {
    const order = await Order.findOne({
      where: {
        [Op.or]: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) throw new NotFoundError('Order not found');

    if (userId && order.userId !== userId) {
      throw new UnauthorizedError('Unauthorized to inspect this order');
    }

    if (order.status === 'PAID') {
      return { status: 'PAID', order };
    }

    // Double check with Cashfree server directly
    let payments: any[] = [];
    let cfOrderDetails: any = null;
    try {
      [payments, cfOrderDetails] = await Promise.all([
        cashfreeService.getOrderPayments(order.id).catch(() => []),
        cashfreeService.getOrderDetails(order.id).catch(() => null),
      ]);
    } catch (err) {
      logger.error('Error fetching payments from Cashfree:', err);
      return { status: order.status, order };
    }

    const successfulPayment = Array.isArray(payments)
      ? payments.find((p) => p.payment_status === 'SUCCESS')
      : null;

    if (successfulPayment || cfOrderDetails?.order_status === 'PAID') {
      const paymentId = successfulPayment
        ? String(successfulPayment.cf_payment_id)
        : `CF_DIRECT_${cfOrderDetails?.cf_order_id || Date.now()}`;
      const amount = successfulPayment
        ? Number(successfulPayment.payment_amount)
        : Number(cfOrderDetails?.order_amount || order.netAmount);
      const paymentMethod = successfulPayment?.payment_group || 'ONLINE';

      await this.fulfillPaidOrder({
        orderId: order.id,
        cfPaymentId: paymentId,
        amount,
        paymentMethod,
        rawPayload: successfulPayment || cfOrderDetails || {},
      });

      const updatedOrder = await Order.findByPk(order.id, {
        include: [{ model: OrderItem, as: 'items' }],
      });
      return { status: 'PAID', order: updatedOrder };
    }

    return { status: order.status, order };
  }

  public async fulfillPaidOrder(params: {
    orderId: string;
    cfPaymentId: string;
    amount: number;
    paymentMethod: string;
    rawPayload: object;
  }) {
    // 1. Check idempotency: if payment already recorded, do nothing
    const existingPayment = await Payment.findOne({
      where: { cashfreePaymentId: params.cfPaymentId },
    });

    if (existingPayment && existingPayment.status === 'SUCCESS') {
      logger.info(`Idempotency check: Payment ${params.cfPaymentId} already processed.`);
      return;
    }

    const transaction = await sequelize.transaction();
    try {
      // Lock only the Order row directly (avoiding outer join locking issues on PostgreSQL)
      const order = await Order.findByPk(params.orderId, {
        transaction,
        lock: true,
      });

      if (!order) {
        throw new NotFoundError(`Order ${params.orderId} not found`);
      }

      if (order.status === 'PAID') {
        logger.info(`Order ${order.id} is already fulfilled as PAID.`);
        await transaction.commit();
        return;
      }

      // 2. Mark order as PAID
      await order.update({ status: 'PAID' }, { transaction });

      // 3. Create or update payment record
      await Payment.create(
        {
          orderId: order.id,
          paymentGateway: 'CASHFREE',
          cashfreeOrderId: order.id,
          cashfreePaymentId: params.cfPaymentId,
          paymentMethod: params.paymentMethod,
          amount: params.amount,
          currency: order.currency,
          status: 'SUCCESS',
          rawWebhookPayload: params.rawPayload,
          completedAt: new Date(),
        },
        { transaction }
      );

      // 4. Create Book Purchase Entitlements for each book in order
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction,
      });

      for (const item of orderItems) {
        await BookPurchase.findOrCreate({
          where: {
            userId: order.userId,
            bookId: item.bookId,
            entitlementStatus: 'ACTIVE',
          },
          defaults: {
            userId: order.userId,
            bookId: item.bookId,
            orderId: order.id,
            entitlementStatus: 'ACTIVE',
            grantedAt: new Date(),
          },
          transaction,
        });
      }

      // 5. Audit Log
      await AuditLog.create(
        {
          userId: order.userId,
          action: 'PAYMENT_SUCCESS_ENTITLEMENT_GRANTED',
          entityType: 'ORDER',
          entityId: order.id,
          newValues: {
            cashfreePaymentId: params.cfPaymentId,
            amount: params.amount,
            booksGranted: orderItems.map((i) => i.bookId),
          },
        },
        { transaction }
      );

      await transaction.commit();
      logger.info(`🎉 Order ${order.id} fulfilled successfully. Entitlements granted.`);
    } catch (error) {
      await transaction.rollback();
      logger.error('Error fulfilling paid order transaction:', error);
      throw error;
    }
  }

  public async processRefund(
    paymentId: string,
    refundAmount: number,
    reason: string,
    adminUserId: string
  ) {
    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Order, as: 'order' }],
    });

    if (!payment) throw new NotFoundError('Payment record not found');
    if (payment.status !== 'SUCCESS') {
      throw new BadRequestError('Only successful payments can be refunded');
    }

    const refundId = `REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const cfRefund = await cashfreeService.createRefund({
      orderId: payment.orderId,
      refundId,
      refundAmount,
      refundReason: reason,
    });

    const refundRecord = await Refund.create({
      paymentId: payment.id,
      cashfreeRefundId: cfRefund.cf_refund_id || refundId,
      refundAmount,
      reason,
      status: 'PROCESSED',
      processedAt: new Date(),
    });

    await (payment as any).order.update({ status: 'REFUNDED' });

    // Revoke entitlements associated with order
    await BookPurchase.update(
      { entitlementStatus: 'REVOKED' },
      { where: { orderId: payment.orderId } }
    );

    await AuditLog.create({
      userId: adminUserId,
      action: 'ORDER_REFUNDED_ENTITLEMENTS_REVOKED',
      entityType: 'ORDER',
      entityId: payment.orderId,
      newValues: { refundAmount, reason },
    });

    return refundRecord;
  }
}

export const paymentsService = new PaymentsService();
