import { Request, Response, NextFunction } from 'express';
import { drmManagementService } from './drm.service';
import { sendSuccess } from '../../utils/apiResponse';

export class DrmController {
  public async issueLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await drmManagementService.issueLicense(
        req.user!.id,
        req.body.bookId,
        req.body.deviceId,
        req.body.format
      );

      sendSuccess({
        res,
        statusCode: 200,
        message: 'DRM license issued successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async renewLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await drmManagementService.renewLicense(
        req.body.licenseId,
        req.body.deviceId,
        req.user!.id
      );

      sendSuccess({
        res,
        message: 'DRM license lease renewed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async revokeLicenseAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await drmManagementService.revokeLicense(
        req.params.id,
        req.user!.id,
        req.body.reason
      );

      sendSuccess({
        res,
        message: 'DRM license revoked',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async listAllAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const licenses = await drmManagementService.listAllLicensesAdmin();
      sendSuccess({ res, data: licenses });
    } catch (error) {
      next(error);
    }
  }
}

export const drmController = new DrmController();
