import { Op } from 'sequelize';
import crypto from 'crypto';
import {
  sequelize,
  Order,
  OrderItem,
  Book,
  User,
  BookPurchase,
  Payment,
} from '../../database/models';
import { cashfreeService } from '../../services/cashfree.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

export class OrdersService {
  public async createOrder(
    userId: string,
    bookIds: string[],
    returnUrl?: string
  ) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found');

    // 1. Fetch requested books
    const books = await Book.findAll({
      where: {
        id: { [Op.in]: bookIds },
        status: 'PUBLISHED',
      },
    });

    if (books.length !== bookIds.length) {
      throw new BadRequestError('One or more selected books are invalid or unavailable');
    }

    // 2. Check if customer already owns any of these books
    const existingEntitlements = await BookPurchase.findAll({
      where: {
        userId,
        bookId: { [Op.in]: bookIds },
        entitlementStatus: 'ACTIVE',
      },
      include: [{ model: Book, as: 'book', attributes: ['title'] }],
    });

    if (existingEntitlements.length > 0) {
      const ownedTitles = existingEntitlements
        .map((e: any) => e.book?.title)
        .join(', ');
      throw new BadRequestError(
        `You already own an active digital reading entitlement for: ${ownedTitles}`
      );
    }

    // 3. Compute verified financial amounts strictly from database prices
    let totalAmount = 0;
    let netAmount = 0;

    const itemsData = books.map((book) => {
      const price = Number(book.basePrice);
      const salePrice = Number(book.salePrice);
      const discount = Math.max(0, price - salePrice);

      totalAmount += price;
      netAmount += salePrice;

      return {
        bookId: book.id,
        price,
        discount,
        netPrice: salePrice,
      };
    });

    const discountAmount = Math.max(0, totalAmount - netAmount);
    const orderNumber = `AVZ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create Order and OrderItems inside transaction
    const transaction = await sequelize.transaction();
    let localOrder: Order;

    try {
      localOrder = await Order.create(
        {
          userId,
          orderNumber,
          totalAmount,
          discountAmount,
          netAmount,
          currency: 'INR',
          status: 'PENDING',
        },
        { transaction }
      );

      for (const item of itemsData) {
        await OrderItem.create(
          {
            orderId: localOrder.id,
            bookId: item.bookId,
            price: item.price,
            discount: item.discount,
            netPrice: item.netPrice,
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // 5. Create Cashfree order session
    let cashfreeOrder;
    try {
      cashfreeOrder = await cashfreeService.createOrder({
        orderId: localOrder.id,
        orderAmount: Number(netAmount.toFixed(2)),
        orderCurrency: 'INR',
        customer: {
          customer_id: user.id,
          customer_name: `${user.firstName} ${user.lastName}`.trim(),
          customer_email: user.email,
          customer_phone: user.phone || '9999999999',
        },
        returnUrl,
      });
    } catch (error: any) {
      // Mark local order failed if gateway session creation fails
      await localOrder.update({ status: 'FAILED' });
      throw error;
    }

    return {
      order: localOrder,
      items: itemsData,
      paymentSessionId: cashfreeOrder.payment_session_id,
      cfOrderId: cashfreeOrder.cf_order_id,
      environment: process.env.CASHFREE_ENVIRONMENT || 'SANDBOX',
    };
  }

  public async getUserOrders(userId: string) {
    return await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'coverImageUrl'] }],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'paymentMethod', 'amount', 'status', 'completedAt'],
        },
      ],
    });
  }

  public async getOrderById(orderId: string, userId: string, roleName: string) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'coverImageUrl', 'slug'] }],
        },
        {
          model: Payment,
          as: 'payments',
        },
      ],
    });

    if (!order) throw new NotFoundError('Order not found');

    if (roleName !== 'SUPER_ADMIN' && roleName !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenError('Access to this order is denied');
    }

    return order;
  }

  public async listAllOrdersAdmin() {
    return await Order.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: OrderItem, as: 'items', include: [{ model: Book, as: 'book', attributes: ['id', 'title'] }] },
        { model: Payment, as: 'payments' },
      ],
    });
  }
}

export const ordersService = new OrdersService();
