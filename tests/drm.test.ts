import AdmZip from 'adm-zip';
import request from 'supertest';
import app from '../src/app';
import {
  sequelize,
  Book,
  Order,
  BookPurchase,
  BookFile,
} from '../src/database/models';

jest.setTimeout(30000);

describe('DRM, Devices, Encrypted Downloads & Reading Telemetry Integration Tests', () => {
  let customerToken: string;
  let customerId: string;
  let deviceId: string;
  let testBookId: string;
  let issuedLicenseId: string;
  let downloadToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.authenticate();

    // 1. Register customer
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `drm_reader_${Date.now()}@example.com`,
        password: 'DrmPassword2026!',
        firstName: 'Devika',
        lastName: 'Rathore',
      });

    customerToken = regRes.body.data.accessToken;
    customerId = regRes.body.data.user.id;

    // 2. Create published book with raw EPUB file attached
    const book = await Book.create({
      title: 'Advanced Applied Cryptography',
      slug: `applied-crypto-${Date.now()}`,
      description: 'Zero-knowledge proofs, hardware attestation, and DRM',
      basePrice: 999,
      salePrice: 699,
      status: 'PUBLISHED',
    });
    testBookId = book.id;

    // Attach a real valid EPUB structure
    const zip = new AdmZip();
    zip.addFile('mimetype', Buffer.from('application/epub+zip'));
    zip.addFile('META-INF/container.xml', Buffer.from('<container/>'));
    zip.addFile('OEBPS/content.opf', Buffer.from('<package/>'));
    zip.addFile('OEBPS/chap1.xhtml', Buffer.from('<html><body><h1>Chapter 1</h1></body></html>'));
    const epubDummyBuffer = zip.toBuffer();
    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@avazas.com',
        password: 'SuperAdmin@Avazas2026',
      });

    await request(app)
      .post(`/api/v1/books/${testBookId}/manuscript`)
      .set('Authorization', `Bearer ${loginAdmin.body.data.accessToken}`)
      .attach('manuscript', epubDummyBuffer, 'crypto_guide.epub');

    // 3. Create paid order & grant active BookPurchase entitlement to customer
    const order = await Order.create({
      userId: customerId,
      orderNumber: `AVZ-DRM-${Date.now()}`,
      totalAmount: 699,
      discountAmount: 0,
      netAmount: 699,
      currency: 'INR',
      status: 'PAID',
    });

    await BookPurchase.create({
      userId: customerId,
      bookId: testBookId,
      orderId: order.id,
      entitlementStatus: 'ACTIVE',
      grantedAt: new Date(),
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('1. should register a new Android customer device', async () => {
    const res = await request(app)
      .post('/api/v1/devices/register')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deviceIdentifier: `android_hw_id_${Date.now()}`,
        deviceName: 'Pixel 9 Pro',
        deviceModel: 'Google Pixel 9 Pro Fold',
        osVersion: 'Android 15',
        appVersion: '1.0.0',
        devicePublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0...',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.id).toBeDefined();
    deviceId = res.body.data.id;
  });

  it('2. should enforce maximum authorized device limit (3 devices)', async () => {
    // Register 2 more devices to hit quota of 3
    for (let i = 2; i <= 3; i++) {
      await request(app)
        .post('/api/v1/devices/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          deviceIdentifier: `device_id_quota_${i}_${Date.now()}`,
          deviceName: `Tablet ${i}`,
          deviceModel: `Samsung Tab S${i}`,
        });
    }

    // 4th device registration should be rejected
    const res = await request(app)
      .post('/api/v1/devices/register')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deviceIdentifier: `device_id_quota_4_${Date.now()}`,
        deviceName: 'Excess Phone',
        deviceModel: 'OnePlus 12',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('DEVICE_LIMIT_EXCEEDED');
  });

  it('3. should issue a signed Readium LCP-compliant DRM license for purchased book', async () => {
    const res = await request(app)
      .post('/api/v1/drm/licenses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookId: testBookId,
        deviceId,
        format: 'EPUB',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.licenseId).toBeDefined();
    expect(res.body.data.licenseDocument).toBeDefined();
    expect(res.body.data.licenseDocument.encryption.profile).toBe('http://readium.org/lcp/basic-profile');
    expect(res.body.data.licenseDocument.signature).toBeDefined();
    expect(res.body.data.licenseDocument.rights.print).toBe(0);
    expect(res.body.data.licenseDocument.rights.copy).toBe(0);

    issuedLicenseId = res.body.data.licenseId;
  });

  it('4. should reject DRM license request for an unpurchased book', async () => {
    const fakeBookId = '00000000-0000-0000-0000-000000000001';
    const res = await request(app)
      .post('/api/v1/drm/licenses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookId: fakeBookId,
        deviceId,
        format: 'EPUB',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('5. should renew license offline lease', async () => {
    const res = await request(app)
      .post('/api/v1/drm/licenses/renew')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        licenseId: issuedLicenseId,
        deviceId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it('6. should authorize encrypted publication download and stream package', async () => {
    // 1. Authorize download
    const authRes = await request(app)
      .post('/api/v1/downloads/authorize')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookId: testBookId,
        licenseId: issuedLicenseId,
        deviceId,
        format: 'EPUB',
      });

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.data.downloadUrl).toBeDefined();

    const streamPath = authRes.body.data.downloadUrl;

    // 2. Stream encrypted file
    const streamRes = await request(app).get(streamPath);
    expect(streamRes.status).toBe(200);
    expect(streamRes.headers['content-type']).toBe('application/epub+zip');
    expect(Number(streamRes.headers['content-length'])).toBeGreaterThan(0);
  });

  it('7. should sync and retrieve reading progress', async () => {
    const locator = 'epubcfi(/6/4[chap03]!/4/2/10/1:20)';
    const syncRes = await request(app)
      .post('/api/v1/reading/progress')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookId: testBookId,
        locatorJson: locator,
        percentageComplete: 35.5,
        currentPage: 110,
        totalPages: 310,
      });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.success).toBe(true);

    // Retrieve
    const getRes = await request(app)
      .get(`/api/v1/reading/progress/${testBookId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.locatorJson).toBe(locator);
    expect(Number(getRes.body.data.percentageComplete)).toBe(35.5);
  });

  it('8. should create, retrieve, and delete bookmarks', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/reading/bookmarks')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookId: testBookId,
        locatorJson: 'epubcfi(/6/6[chap05]!/4/2:0)',
        title: 'Key Encapsulation Mechanism',
        note: 'Review lattice cryptography assumptions',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const bookmarkId = createRes.body.data.id;

    // Retrieve
    const listRes = await request(app)
      .get(`/api/v1/reading/bookmarks/${testBookId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    expect(listRes.body.data[0].id).toBe(bookmarkId);

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/reading/bookmarks/${bookmarkId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
