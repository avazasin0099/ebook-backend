import crypto from 'crypto';
import https from 'https';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
}

export class CashfreeService {
  private appId = process.env.CASHFREE_APP_ID || 'TEST_APP_ID';
  private secretKey = process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY';
  private apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
  private apiBase = process.env.CASHFREE_API_BASE || 'https://sandbox.cashfree.com/pg';

  private makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: object
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.apiBase}${endpoint}`);
      const payload = body ? JSON.stringify(body) : undefined;

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        headers: {
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': this.apiVersion,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed as T);
            } else {
              logger.error(`Cashfree API Error [${res.statusCode}]: ${responseData}`);
              reject(
                new BadRequestError(
                  parsed.message || 'Cashfree payment service error',
                  'CASHFREE_API_ERROR',
                  parsed
                )
              );
            }
          } catch (err) {
            reject(new BadRequestError('Invalid JSON response from Cashfree gateway'));
          }
        });
      });

      req.on('error', (err) => {
        logger.error('Cashfree Request Network Error:', err);
        reject(new BadRequestError('Failed to communicate with Cashfree payment gateway'));
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  public async createOrder(data: {
    orderId: string;
    orderAmount: number;
    orderCurrency?: string;
    customer: CashfreeCustomerDetails;
    returnUrl?: string;
  }): Promise<CashfreeOrderResponse> {
    const returnUrl =
      data.returnUrl ||
      process.env.CASHFREE_RETURN_URL ||
      `http://localhost:5173/payment-status?order_id=${data.orderId}`;

    const body = {
      order_id: data.orderId,
      order_amount: data.orderAmount,
      order_currency: data.orderCurrency || 'INR',
      customer_details: {
        customer_id: data.customer.customer_id,
        customer_name: data.customer.customer_name,
        customer_email: data.customer.customer_email,
        customer_phone: data.customer.customer_phone || '9999999999',
      },
      order_meta: {
        return_url: returnUrl,
      },
      order_note: 'Avazas Books Digital E-Book Purchase',
    };

    return await this.makeRequest<CashfreeOrderResponse>('/orders', 'POST', body);
  }

  public async getOrderPayments(orderId: string): Promise<any[]> {
    return await this.makeRequest<any[]>(`/orders/${orderId}/payments`, 'GET');
  }

  public async getOrderDetails(orderId: string): Promise<any> {
    return await this.makeRequest<any>(`/orders/${orderId}`, 'GET');
  }

  public verifyWebhookSignature(
    rawBody: string,
    timestamp: string,
    signature: string
  ): boolean {
    if (!timestamp || !signature) return false;

    const dataToSign = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('base64');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch {
      return false;
    }
  }

  public async createRefund(data: {
    orderId: string;
    refundId: string;
    refundAmount: number;
    refundReason?: string;
  }): Promise<any> {
    const body = {
      refund_id: data.refundId,
      refund_amount: data.refundAmount,
      refund_note: data.refundReason || 'Customer requested refund',
    };

    return await this.makeRequest<any>(`/orders/${data.orderId}/refunds`, 'POST', body);
  }
}

export const cashfreeService = new CashfreeService();
