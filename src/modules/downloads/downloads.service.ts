import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import {
  DrmLicense,
  DrmDeviceAuthorization,
  BookFile,
  DrmDownload,
} from '../../database/models';
import { storageService } from '../../services/storage.service';
import { BadRequestError, NotFoundError, ForbiddenError, UnauthorizedError } from '../../utils/errors';

export class DownloadsService {
  private downloadSecret =
    process.env.JWT_ACCESS_SECRET ||
    'avazas_super_secure_access_jwt_secret_token_key_2026_xyz';

  public async authorizeDownload(params: {
    userId: string;
    bookId: string;
    licenseKeyId: string;
    deviceId: string;
    format: 'EPUB' | 'PDF';
    ipAddress?: string;
  }) {
    // 1. Verify license and active status
    const license = await DrmLicense.findOne({
      where: {
        licenseKeyId: params.licenseKeyId,
        userId: params.userId,
        bookId: params.bookId,
        status: 'ACTIVE',
      },
    });

    if (!license) {
      throw new ForbiddenError('DRM License is invalid, expired, or revoked');
    }

    // 2. Verify device authorization
    const auth = await DrmDeviceAuthorization.findOne({
      where: {
        licenseId: license.id,
        deviceId: params.deviceId,
        status: 'ACTIVE',
      },
    });

    if (!auth) {
      throw new ForbiddenError('This device is not authorized for this DRM license');
    }

    // 3. Verify encrypted package exists
    const bookFile = await BookFile.findOne({
      where: { bookId: params.bookId, format: params.format },
    });

    if (!bookFile || !bookFile.encryptedStoragePath) {
      throw new NotFoundError('Encrypted publication package is not ready for download');
    }

    const exists = await storageService.fileExists(bookFile.encryptedStoragePath);
    if (!exists) {
      throw new NotFoundError('Publication file not found on storage');
    }

    // 4. Generate short-lived signed download token (15 mins)
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const tokenPayload = {
      downloadToken,
      fileId: bookFile.id,
      storagePath: bookFile.encryptedStoragePath,
      userId: params.userId,
      deviceId: params.deviceId,
      format: params.format,
    };

    const signedToken = jwt.sign(tokenPayload, this.downloadSecret, {
      expiresIn: '15m',
    });

    // 5. Record Download Authorization
    await DrmDownload.create({
      licenseId: license.id,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress || null,
      downloadToken,
      tokenExpiresAt,
      isCompleted: false,
    });

    const downloadUrl = `/api/v1/downloads/stream?token=${signedToken}`;

    return {
      downloadUrl,
      format: params.format,
      fileSizeBytes: Number(bookFile.fileSizeBytes),
      checksumSha256: bookFile.checksumSha256,
      expiresAt: tokenExpiresAt,
    };
  }

  public async getFileForStream(token: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(token, this.downloadSecret);
    } catch {
      throw new UnauthorizedError('Download token has expired or is invalid');
    }

    const download = await DrmDownload.findOne({
      where: { downloadToken: decoded.downloadToken },
    });

    if (!download) {
      throw new UnauthorizedError('Download session not found');
    }

    if (download.tokenExpiresAt < new Date()) {
      throw new UnauthorizedError('Download token has expired');
    }

    const fullPath = storageService.getAbsolutePath(decoded.storagePath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundError('Target file not found');
    }

    // Mark completed
    await download.update({
      isCompleted: true,
      completedAt: new Date(),
    });

    const mimeType =
      decoded.format === 'EPUB' ? 'application/epub+zip' : 'application/pdf';

    return {
      fullPath,
      mimeType,
      fileSize: fs.statSync(fullPath).size,
      filename: `publication_protected.${decoded.format.toLowerCase()}`,
    };
  }
}

export const downloadsService = new DownloadsService();
