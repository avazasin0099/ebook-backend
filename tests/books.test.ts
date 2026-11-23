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

  describe('class & subject filters', () => {
    const stamp = Date.now();
    const class8 = `Class 8 ${stamp}`;
    const class9 = `Class 9 ${stamp}`;
    let physicsBookId: string;
    let mathBookId: string;
    let studentToken: string;

    const createPublished = async (title: string, className: string, subject: string) => {
      const created = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title,
          slug: `${title.toLowerCase().replace(/\s+/g, '-')}-${stamp}`,
          description: 'Filter test book',
          basePrice: 100,
          salePrice: 50,
          className,
          subject,
        });
      expect(created.status).toBe(201);
      await request(app)
        .patch(`/api/v1/books/${created.body.data.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PUBLISHED' });
      return created.body.data;
    };

    beforeAll(async () => {
      const physics = await createPublished('Physics Basics', class8, 'Physics');
      const math = await createPublished('Math Basics', class9, 'Math');
      physicsBookId = physics.id;
      mathBookId = math.id;
      expect(physics.className).toBe(class8.toLowerCase());
      expect(physics.subject).toBe('physics');

      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `student_${stamp}@example.com`,
          password: 'StudentPass2026!',
          firstName: 'Rahim',
          lastName: 'Uddin',
          className: `  ${class8.toUpperCase()} `,
        });
      expect(reg.status).toBe(201);
      expect(reg.body.data.user.className).toBe(class8.toLowerCase());
      studentToken = reg.body.data.accessToken;
    });

    it('rejects registration without className', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `noclass_${stamp}@example.com`,
          password: 'StudentPass2026!',
          firstName: 'No',
          lastName: 'Class',
        });
      expect(res.status).toBe(400);
    });

    it('logged-in student sees only books of their class by default', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ limit: 100 });
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).toContain(physicsBookId);
      expect(ids).not.toContain(mathBookId);
      expect(res.body.data.every((b: any) => b.className === class8.toLowerCase())).toBe(true);
    });

    it('student cannot override their class with ?class=', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ class: class9 });
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).not.toContain(mathBookId);
    });

    it('guest sees books of all classes and can filter with ?class=', async () => {
      const all = await request(app).get('/api/v1/books').query({ search: 'Basics', limit: 100 });
      const ids = all.body.data.map((b: any) => b.id);
      expect(ids).toEqual(expect.arrayContaining([physicsBookId, mathBookId]));

      const filtered = await request(app).get('/api/v1/books').query({ class: class9 });
      expect(filtered.body.data.map((b: any) => b.id)).toEqual([mathBookId]);
    });

    it('filters by subject via query param (case-insensitive)', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .query({ subject: 'PHYSICS', search: 'Basics' });
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).toContain(physicsBookId);
      expect(ids).not.toContain(mathBookId);
    });

    it('filters by subject via route param', async () => {
      const res = await request(app)
        .get('/api/v1/books/subject/math')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      // student is class 8, the math book is class 9, so nothing matches
      expect(res.body.data.map((b: any) => b.id)).not.toContain(mathBookId);

      const guest = await request(app).get('/api/v1/books/subject/math').query({ search: 'Basics' });
      const guestIds = guest.body.data.map((b: any) => b.id);
      expect(guestIds).toContain(mathBookId);
      expect(guestIds).not.toContain(physicsBookId);
    });

    it('combines subject with the existing category filter', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .query({ subject: 'physics', category: `no-such-category-${stamp}` });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
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
