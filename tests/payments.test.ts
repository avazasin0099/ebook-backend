import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';
import { sequelize, Book, Order, BookPurchase, Payment } from '../src/database/models';

jest.setTimeout(30000);

describe('Orders & Cashfree Payments Integration Tests', () => {
  let customerToken: string;
  let customerId: string;
  let testBookId: string;
  let testOrderId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.authenticate();

    // 1. Register a fresh customer
    const uniqueEmail = `buyer_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'BuyerPassword2026!',
        firstName: 'Ananya',
        lastName: 'Sen',
        phone: '+919876543210',
      });

    customerToken = regRes.body.data.accessToken;
    customerId = regRes.body.data.user.id;

    // 2. Fetch or create a published book
    let book = await Book.findOne({ where: { status: 'PUBLISHED' } });
    if (!book) {
      book = await Book.create({
        title: 'Cloud Security Blueprints',
        slug: `cloud-sec-${Date.now()}`,
        description: 'Applied cryptography and zero trust',
        basePrice: 500,
        salePrice: 350,
        status: 'PUBLISHED',
      });
    }
    testBookId = book.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('1. should create an order from book checkout and initialize Cashfree session', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookIds: [testBookId],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testOrderId = res.body.data.order.id;
    expect(res.body.data.order.status).toBe('PENDING');
    expect(Number(res.body.data.order.netAmount)).toBeGreaterThan(0);
    expect(res.body.data.paymentSessionId).toBeDefined();
  });

  it('2. should reject Cashfree webhook with invalid HMAC signature', async () => {
    const fakePayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: testOrderId },
        payment: { cf_payment_id: 9999999, payment_amount: 350 },
      },
    };

    const res = await request(app)
      .post('/api/v1/payments/cashfree/webhook')
      .set('x-webhook-timestamp', '1700000000')
      .set('x-webhook-signature', 'invalid_signature_hash')
      .send(fakePayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. should process valid signed Cashfree webhook and grant reading entitlement', async () => {
    const cfPaymentId = `CF_PAY_${Date.now()}`;
    const payload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: testOrderId },
        payment: {
          cf_payment_id: cfPaymentId,
          payment_amount: 350,
          payment_group: 'UPI',
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secretKey = process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY';
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    const res = await request(app)
      .post('/api/v1/payments/cashfree/webhook')
      .set('x-webhook-timestamp', timestamp)
      .set('x-webhook-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    // Verify database state
    const order = await Order.findByPk(testOrderId);
    expect(order?.status).toBe('PAID');

    const payment = await Payment.findOne({ where: { cashfreePaymentId: cfPaymentId } });
    expect(payment).toBeDefined();
    expect(payment?.status).toBe('SUCCESS');

    const entitlement = await BookPurchase.findOne({
      where: { userId: customerId, bookId: testBookId, entitlementStatus: 'ACTIVE' },
    });
    expect(entitlement).toBeDefined();
  });

  it('4. should be idempotent and handle duplicate webhook deliveries safely', async () => {
    const existingPayment = await Payment.findOne({ where: { orderId: testOrderId } });
    expect(existingPayment).toBeDefined();

    const payload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: testOrderId },
        payment: {
          cf_payment_id: existingPayment!.cashfreePaymentId,
          payment_amount: 350,
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secretKey = process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY';
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    const res = await request(app)
      .post('/api/v1/payments/cashfree/webhook')
      .set('x-webhook-timestamp', timestamp)
      .set('x-webhook-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);

    // Verify entitlements count did not duplicate
    const entitlementsCount = await BookPurchase.count({
      where: { userId: customerId, bookId: testBookId, entitlementStatus: 'ACTIVE' },
    });
    expect(entitlementsCount).toBe(1);
  });

  it('5. should prevent re-purchasing an already owned active entitlement', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookIds: [testBookId],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already own an active digital reading entitlement');
  });
});
