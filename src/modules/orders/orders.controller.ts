import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { sendSuccess } from '../../utils/apiResponse';

export class OrdersController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ordersService.createOrder(
        req.user!.id,
        req.body.bookIds,
        req.body.returnUrl
      );

      sendSuccess({
        res,
        statusCode: 201,
        message: 'Order created and Cashfree checkout session initialized',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await ordersService.getUserOrders(req.user!.id);
      sendSuccess({ res, data: orders });
    } catch (error) {
      next(error);
    }
  }

  public async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await ordersService.getOrderById(
        req.params.id,
        req.user!.id,
        req.user!.roleName
      );
      sendSuccess({ res, data: order });
    } catch (error) {
      next(error);
    }
  }

  public async listAllAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await ordersService.listAllOrdersAdmin();
      sendSuccess({ res, data: orders });
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();
