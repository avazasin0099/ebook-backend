import { Op, fn, col, literal } from 'sequelize';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import {
  User,
  Role,
  Permission,
  RolePermission,
  Book,
  Order,
  OrderItem,
  Payment,
  DrmLicense,
  UserDevice,
  AuditLog,
} from '../../database/models';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../utils/errors';

export class AdminService {
  public async getDashboardAnalytics() {
    const customerRole = await Role.findOne({ where: { name: 'CUSTOMER' } });
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });

    const [
      totalCustomers,
      totalAdmins,
      totalBooks,
      publishedBooks,
      draftBooks,
      totalOrders,
      paidOrders,
      totalRevenueResult,
      recentPayments,
      activeLicenses,
    ] = await Promise.all([
      User.count({ where: { roleId: customerRole?.id } }),
      User.count({ where: { roleId: adminRole?.id } }),
      Book.count(),
      Book.count({ where: { status: 'PUBLISHED' } }),
      Book.count({ where: { status: 'DRAFT' } }),
      Order.count(),
      Order.count({ where: { status: 'PAID' } }),
      Payment.sum('amount', { where: { status: 'SUCCESS' } }),
      Payment.findAll({
        where: { status: 'SUCCESS' },
        limit: 10,
        order: [['completedAt', 'DESC']],
        include: [{ model: Order, as: 'order', include: [{ model: User, as: 'user', attributes: ['email', 'firstName', 'lastName'] }] }],
      }),
      DrmLicense.count({ where: { status: 'ACTIVE' } }),
    ]);

    const totalRevenue = totalRevenueResult || 0;

    return {
      overview: {
        totalCustomers,
        totalAdmins,
        totalBooks,
        publishedBooks,
        draftBooks,
        totalOrders,
        paidOrders,
        totalRevenue,
        activeLicenses,
      },
      recentTransactions: recentPayments,
    };
  }

  public async listCustomers(params: { search?: string; status?: string; page?: number; limit?: number }) {
    const customerRole = await Role.findOne({ where: { name: 'CUSTOMER' } });
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const where: any = { roleId: customerRole?.id };

    if (params.search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${params.search}%` } },
        { firstName: { [Op.like]: `%${params.search}%` } },
        { lastName: { [Op.like]: `%${params.search}%` } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'status', 'emailVerified', 'lastLoginAt', 'createdAt'],
      include: [{ model: UserDevice, as: 'devices' }],
    });

    return {
      customers: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  }

  public async setCustomerStatus(customerId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const customer = await User.findByPk(customerId, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!customer) throw new NotFoundError('Customer not found');
    if ((customer as any).role?.name !== 'CUSTOMER') {
      throw new ForbiddenError('Cannot modify status of non-customer accounts via this endpoint');
    }

    await customer.update({ status });
    return customer;
  }

  public async createAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) throw new NotFoundError('Admin role not configured');

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const admin = await User.create({
      roleId: adminRole.id,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: false,
    });

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: 'ADMIN',
      status: admin.status,
    };
  }

  public async generateSalesReportExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Avazas Books';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 36 },
      { header: 'Order Number', key: 'orderNumber', width: 22 },
      { header: 'Customer Email', key: 'customerEmail', width: 30 },
      { header: 'Amount (INR)', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 18 },
      { header: 'Date', key: 'date', width: 24 },
    ];

    const orders = await Order.findAll({
      where: { status: 'PAID' },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['email'] },
        { model: Payment, as: 'payments', attributes: ['paymentMethod', 'amount', 'completedAt'] },
      ],
    });

    for (const order of orders) {
      const user = (order as any).user;
      const payment = (order as any).payments?.[0];

      sheet.addRow({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: user?.email || 'N/A',
        amount: Number(order.netAmount),
        status: order.status,
        paymentMethod: payment?.paymentMethod || 'CASHFREE',
        date: order.createdAt.toISOString(),
      });
    }

    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const adminService = new AdminService();
