import crypto from 'crypto';
import {
  BookPurchase,
  BookFile,
  UserDevice,
  User,
  DrmLicense,
  DrmDeviceAuthorization,
  DrmLicenseEvent,
  PlatformSetting,
} from '../../database/models';
import { drmService } from '../../services/drm.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';
import logger from '../../utils/logger';

export class DrmManagementService {
  public async issueLicense(
    userId: string,
    bookId: string,
    deviceId: string,
    format: 'EPUB' | 'PDF' = 'EPUB'
  ) {
    // 1. Verify active purchase entitlement
    const purchase = await BookPurchase.findOne({
      where: { userId, bookId, entitlementStatus: 'ACTIVE' },
    });

    if (!purchase) {
      throw new ForbiddenError(
        'Access denied: You do not have an active purchase entitlement for this book'
      );
    }

    // 2. Verify registered active device
    const device = await UserDevice.findOne({
      where: { id: deviceId, userId, status: 'ACTIVE' },
    });

    if (!device) {
      throw new ForbiddenError('Access denied: Device is not authorized or is inactive');
    }

    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found');

    // 3. Ensure publication file is processed and packaged
    const bookFile = await BookFile.findOne({
      where: { bookId, format },
    });

    if (!bookFile) {
      throw new NotFoundError(`No ${format} publication file is uploaded for this book`);
    }

    let contentKey: Buffer;
    if (!bookFile.isProcessed || !bookFile.encryptedStoragePath) {
      contentKey = drmService.generateContentKey();
      const pkgResult = await drmService.packagePublication(
        bookFile.rawStoragePath,
        format,
        contentKey
      );

      await bookFile.update({
        encryptedStoragePath: pkgResult.encryptedStoragePath,
        fileSizeBytes: pkgResult.fileSizeBytes,
        checksumSha256: pkgResult.checksum,
        isProcessed: true,
      });
    } else {
      contentKey = drmService.generateContentKey();
    }

    // 4. Wrap Content Key with Device Public Key / Hardware Binding
    const deviceSecret = device.devicePublicKey || device.deviceIdentifier;
    const wrappedContentKey = drmService.wrapContentKey(contentKey, deviceSecret);

    // 5. Generate Signed LCP License Document
    const setting = await PlatformSetting.findByPk('drm_offline_days_limit');
    const offlineDays = (setting?.value as any)?.value || 30;

    const licenseKeyId = `lic_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const licenseDoc = drmService.generateLcpLicense({
      licenseId: licenseKeyId,
      userId: user.id,
      userEmail: user.email,
      wrappedContentKey,
      daysValid: offlineDays,
    });

    const expiresAt = new Date(Date.now() + offlineDays * 24 * 60 * 60 * 1000);

    // 6. Record License & Device Authorization in Database
    const license = await DrmLicense.create({
      purchaseId: purchase.id,
      userId: user.id,
      bookId,
      licenseKeyId,
      licenseProvider: 'READIUM_LCP',
      licenseDocument: licenseDoc,
      issuedAt: new Date(),
      expiresAt,
      status: 'ACTIVE',
    });

    await DrmDeviceAuthorization.create({
      licenseId: license.id,
      deviceId: device.id,
      authorizedAt: new Date(),
      expiresAt,
      status: 'ACTIVE',
    });

    // 7. Emit DRM Audit Event
    await DrmLicenseEvent.create({
      licenseId: license.id,
      deviceId: device.id,
      eventType: 'ISSUED',
      eventMetadata: {
        format,
        deviceModel: device.deviceModel,
        offlineDays,
      },
    });

    logger.info(`🔐 DRM License ${license.licenseKeyId} issued to device ${device.id}`);

    return {
      licenseId: license.licenseKeyId,
      expiresAt,
      licenseDocument: licenseDoc,
    };
  }

  public async renewLicense(licenseKeyId: string, deviceId: string, userId: string) {
    const license = await DrmLicense.findOne({
      where: { licenseKeyId },
      include: [{ model: BookPurchase, as: 'purchase' }],
    });

    if (!license) throw new NotFoundError('DRM License not found');

    if (license.userId !== userId) {
      throw new ForbiddenError('Access denied to renew this license');
    }

    if (license.status === 'REVOKED') {
      throw new ForbiddenError('This license has been revoked by platform policy');
    }

    const purchase = (license as any).purchase as BookPurchase;
    if (!purchase || purchase.entitlementStatus !== 'ACTIVE') {
      throw new ForbiddenError('Book purchase entitlement is no longer active');
    }

    const device = await UserDevice.findOne({
      where: { id: deviceId, userId, status: 'ACTIVE' },
    });

    if (!device) {
      throw new ForbiddenError('Device authorization is no longer valid');
    }

    const setting = await PlatformSetting.findByPk('drm_offline_days_limit');
    const offlineDays = (setting?.value as any)?.value || 30;
    const newExpiresAt = new Date(Date.now() + offlineDays * 24 * 60 * 60 * 1000);

    await license.update({ expiresAt: newExpiresAt, status: 'ACTIVE' });
    await DrmDeviceAuthorization.update(
      { expiresAt: newExpiresAt, status: 'ACTIVE' },
      { where: { licenseId: license.id, deviceId: device.id } }
    );

    await DrmLicenseEvent.create({
      licenseId: license.id,
      deviceId: device.id,
      eventType: 'RENEWED',
      eventMetadata: { renewedUntil: newExpiresAt },
    });

    return {
      licenseId: license.licenseKeyId,
      expiresAt: newExpiresAt,
      status: 'ACTIVE',
    };
  }

  public async revokeLicense(licenseId: string, adminUserId: string, reason?: string) {
    const license = await DrmLicense.findByPk(licenseId);
    if (!license) throw new NotFoundError('License not found');

    await license.update({ status: 'REVOKED' });
    await DrmDeviceAuthorization.update(
      { status: 'REVOKED' },
      { where: { licenseId: license.id } }
    );

    await DrmLicenseEvent.create({
      licenseId: license.id,
      eventType: 'REVOKED',
      eventMetadata: { revokedBy: adminUserId, reason },
    });

    return license;
  }

  public async listAllLicensesAdmin() {
    return await DrmLicense.findAll({
      order: [['issuedAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: DrmDeviceAuthorization, as: 'authorizations', include: [{ model: UserDevice, as: 'device' }] },
      ],
    });
  }
}

export const drmManagementService = new DrmManagementService();
