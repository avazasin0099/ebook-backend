import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/database/models';

jest.setTimeout(30000);

describe('Book & Catalog Management Integration Tests', () => {
  let adminToken: string;
  let authorId: string;
  let publisherId: string;
  let createdBookId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.authenticate();

    // Login as Super Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'SuperAdmin@Avazas2026',
      });

    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('1. should list public categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('2. should create an author (Admin)', async () => {
    const res = await request(app)
      .post('/api/v1/authors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Vikram Chandra',
        biography: 'Expert researcher in cryptography and secure cloud distributed systems.',
        website: 'https://vikramchandra.example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Dr. Vikram Chandra');
    authorId = res.body.data.id;
  });

  it('3. should create a publisher (Admin)', async () => {
    const publisherName = `Avazas Academic Press ${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/publishers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: publisherName,
        description: 'Publishing high-quality technical literature.',
        contactEmail: 'press@avazas.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(publisherName);
    publisherId = res.body.data.id;
  });

  it('4. should create a new Book in DRAFT status (Admin)', async () => {
    const res = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Zero-Trust Cloud Architecture',
        slug: `zero-trust-cloud-${Date.now()}`,
        subtitle: 'Engineering Resilient Enterprise Distributed Systems',
        description: 'Comprehensive guide covering mutual TLS, envelope encryption, and DRM.',
        isbn: `978-${Date.now().toString().slice(-10)}`,
        language: 'en',
        pageCount: 420,
        basePrice: 799.00,
        salePrice: 499.00,
        currency: 'INR',
        availableFormats: 'EPUB,PDF',
        isFeatured: true,
        authorIds: [authorId],
        publisherIds: [publisherId],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Zero-Trust Cloud Architecture');
    expect(res.body.data.status).toBe('DRAFT');
    createdBookId = res.body.data.id;
  });

  it('5. should reject unauthenticated book creation', async () => {
    const res = await request(app)
      .post('/api/v1/books')
      .send({
        title: 'Unauthorized Book',
        slug: 'unauthorized-book',
        description: 'Should fail',
        basePrice: 100,
        salePrice: 100,
      });

    expect(res.status).toBe(401);
  });

  it('6. should publish the book (Admin)', async () => {
    const res = await request(app)
      .patch(`/api/v1/books/${createdBookId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('7. should discover published book in public listing', async () => {
    const res = await request(app)
      .get('/api/v1/books')
      .query({ search: 'Zero-Trust' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(createdBookId);
  });

  it('8. should upload cover image and manuscript to private storage', async () => {
    // 1. Upload dummy cover
    const coverBuffer = Buffer.from('fake-jpeg-image-bytes-header');
    const coverRes = await request(app)
      .post(`/api/v1/books/${createdBookId}/cover`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('cover', coverBuffer, 'cover.jpg');

    expect(coverRes.status).toBe(200);
    expect(coverRes.body.success).toBe(true);
    expect(coverRes.body.data.coverImageUrl).toContain('/api/v1/books/assets/covers/');

    // 2. Upload dummy EPUB manuscript
    const epubBuffer = Buffer.from('PK\x03\x04fake-epub-container-stream');
    const manuscriptRes = await request(app)
      .post(`/api/v1/books/${createdBookId}/manuscript`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('manuscript', epubBuffer, 'sample_manuscript.epub');

    expect(manuscriptRes.status).toBe(200);
    expect(manuscriptRes.body.success).toBe(true);
    expect(manuscriptRes.body.data.format).toBe('EPUB');
    expect(manuscriptRes.body.data.isProcessed).toBe(false);
  });
});
