import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/database/models';

jest.setTimeout(30000);

describe('Authentication & RBAC Integration Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('1. should login successfully as Super Admin with seeded credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'SuperAdmin@Avazas2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('2. should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('3. should register a new Customer account', async () => {
    const uniqueEmail = `testreader_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'ReaderPass2026!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+919999988888',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('4. should prevent duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'superadmin@avazas.com',
        password: 'ReaderPass2026!',
        firstName: 'Imposter',
        lastName: 'Admin',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('5. should fetch profile via /api/v1/auth/me with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'SuperAdmin@Avazas2026',
      });

    const token = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('superadmin@avazas.com');
    expect(meRes.body.data.role.name).toBe('SUPER_ADMIN');
  });

  it('6. should reject /api/v1/auth/me without Bearer token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('7. should rotate refresh token successfully', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'SuperAdmin@Avazas2026',
      });

    const oldRefreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);
  });
});
