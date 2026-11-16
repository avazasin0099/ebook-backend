import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PaymentsController {
  public async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['x-webhook-signature'] as string) || '';
      const timestamp = (req.headers['x-webhook-timestamp'] as string) || '';
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await paymentsService.handleWebhook(
        rawBody,
        timestamp,
        signature,
        req.body
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async verifyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentsService.verifyAndSyncOrder(
        req.params.orderId,
        req.user?.id
      );

      sendSuccess({
        res,
        message: `Order status verified: ${result.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refund = await paymentsService.processRefund(
        req.body.paymentId,
        req.body.amount,
        req.body.reason,
        req.user!.id
      );

      sendSuccess({
        res,
        message: 'Refund processed successfully',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
