import { Request, Response, NextFunction } from 'express';
import { devicesService } from './devices.service';
import { sendSuccess } from '../../utils/apiResponse';

export class DevicesController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await devicesService.registerDevice(req.user!.id, req.body);
      sendSuccess({
        res,
        statusCode: 200,
        message: 'Device registered and authorized',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await devicesService.listUserDevices(req.user!.id);
      sendSuccess({ res, data: devices });
    } catch (error) {
      next(error);
    }
  }

  public async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await devicesService.revokeDevice(
        req.params.id,
        req.user!.id,
        req.user!.roleName
      );
      sendSuccess({
        res,
        message: 'Device authorization revoked',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const devicesController = new DevicesController();
