import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { sendSuccess } from '../../utils/apiResponse';

export class AdminController {
  public async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getDashboardAnalytics();
      sendSuccess({ res, data });
    } catch (error) {
      next(error);
    }
  }

  public async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.listCustomers(req.query as any);
      sendSuccess({ res, data: data.customers, meta: data.meta });
    } catch (error) {
      next(error);
    }
  }

  public async setCustomerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await adminService.setCustomerStatus(req.params.id, req.body.status);
      sendSuccess({ res, message: `Customer status updated to ${req.body.status}`, data: customer });
    } catch (error) {
      next(error);
    }
  }

  public async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await adminService.createAdmin(req.body);
      sendSuccess({ res, statusCode: 201, message: 'Admin account created successfully', data: admin });
    } catch (error) {
      next(error);
    }
  }

  public async exportSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const excelBuffer = await adminService.generateSalesReportExcel();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Avazas_Sales_Report_${Date.now()}.xlsx"`
      );
      res.send(excelBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
