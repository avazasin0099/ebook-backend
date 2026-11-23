import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/database/models';

jest.setTimeout(30000);

describe('Admin Dashboard, Analytics & Reporting Integration Tests', () => {
  let superAdminToken: string;
  let operationalAdminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.authenticate();

    // 1. Super Admin login
    const saLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'SuperAdmin@Avazas2026',
      });
    superAdminToken = saLogin.body.data.accessToken;

    // 2. Customer login
    const custEmail = `cust_dash_${Date.now()}@example.com`;
    const custReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: custEmail,
        password: 'CustPass2026!',
        firstName: 'Sneha',
        lastName: 'Mukherjee',
        className: 'Class 8',
      });
    customerToken = custReg.body.data.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('1. should allow Super Admin to fetch platform analytics overview', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview.totalCustomers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.overview.totalBooks).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
  });

  it('2. should reject customer access to Admin analytics (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('3. should allow Super Admin to create an operational Admin account', async () => {
    const adminEmail = `ops_admin_${Date.now()}@avazas.com`;
    const res = await request(app)
      .post('/api/v1/admin/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: adminEmail,
        password: 'OpsAdminPass2026!',
        firstName: 'Operations',
        lastName: 'Manager',
        phone: '+919811122233',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('ADMIN');

    // Login as the newly created operational Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: adminEmail,
        password: 'OpsAdminPass2026!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('ADMIN');
    operationalAdminToken = loginRes.body.data.accessToken;
  });

  it('4. should prevent operational Admin from creating another Admin (Super Admin only)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/admins')
      .set('Authorization', `Bearer ${operationalAdminToken}`)
      .send({
        email: 'illegal_admin@avazas.com',
        password: 'PassWord123!',
        firstName: 'Illegal',
        lastName: 'Admin',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('5. should allow operational Admin to view customers list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/customers')
      .set('Authorization', `Bearer ${operationalAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('6. should export sales report as Excel binary spreadsheet', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports/sales/excel')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(Number(res.headers['content-length'])).toBeGreaterThan(0);
  });
});
