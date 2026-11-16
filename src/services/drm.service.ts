import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { storageService } from './storage.service';
import logger from '../utils/logger';

export interface LcpRights {
  print: number;
  copy: number;
  start: string;
  end: string | null;
}

export interface LcpLicenseDocument {
  id: string;
  provider: string;
  issued: string;
  updated?: string;
  user: {
    id: string;
    email_hash: string;
  };
  encryption: {
    profile: string;
    content: {
      key: {
        algorithm: string;
        encrypted_value: string;
      };
    };
    user_key: {
      algorithm: string;
      key_check: string;
    };
  };
  rights: LcpRights;
  signature?: string;
}

export class DrmService {
  private masterKey =
    process.env.DRM_MASTER_KEY ||
    '4a8e2b6c9f1d0a5e8b3c7d6e5a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a';

  /**
   * Generates a 32-byte (256-bit) Content Encryption Key (CEK)
   */
  public generateContentKey(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Wraps/encrypts the Content Encryption Key using the device public key or customer secret
   */
  public wrapContentKey(contentKey: Buffer, devicePublicKeyOrSecret: string): string {
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(
      devicePublicKeyOrSecret,
      salt,
      10000,
      32,
      'sha256'
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(contentKey), cipher.final()]);

    // Envelope: salt (16) + iv (16) + encryptedKey
    const envelope = Buffer.concat([salt, iv, encrypted]);
    return envelope.toString('base64');
  }

  /**
   * Generates a signed Readium LCP-compliant license document
   */
  public generateLcpLicense(params: {
    licenseId: string;
    userId: string;
    userEmail: string;
    wrappedContentKey: string;
    daysValid?: number;
  }): LcpLicenseDocument {
    const issued = new Date().toISOString();
    const days = params.daysValid || 30;
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const emailHash = crypto
      .createHash('sha256')
      .update(params.userEmail.toLowerCase())
      .digest('hex');

    const keyCheck = crypto
      .createHmac('sha256', this.masterKey)
      .update(params.licenseId)
      .digest('base64');

    const doc: LcpLicenseDocument = {
      id: params.licenseId,
      provider: process.env.API_BASE_URL || 'https://api.avazasbooks.com/api/v1/drm',
      issued,
      user: {
        id: params.userId,
        email_hash: emailHash,
      },
      encryption: {
        profile: 'http://readium.org/lcp/basic-profile',
        content: {
          key: {
            algorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
            encrypted_value: params.wrappedContentKey,
          },
        },
        user_key: {
          algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
          key_check: keyCheck,
        },
      },
      rights: {
        print: 0,
        copy: 0,
        start: issued,
        end,
      },
    };

    // Cryptographic signature of license document
    const signature = crypto
      .createHmac('sha256', this.masterKey)
      .update(JSON.stringify(doc))
      .digest('base64');

    doc.signature = signature;
    return doc;
  }

  /**
   * Encrypts and packages a publication for DRM-protected distribution
   */
  public async packagePublication(
    rawStoragePath: string,
    format: 'EPUB' | 'PDF',
    contentKey: Buffer
  ): Promise<{ encryptedStoragePath: string; fileSizeBytes: number; checksum: string }> {
    const rawAbsolutePath = storageService.getAbsolutePath(rawStoragePath);
    const rawBuffer = await fs.promises.readFile(rawAbsolutePath);

    let encryptedBuffer: Buffer;

    if (format === 'EPUB') {
      encryptedBuffer = this.encryptEpubPackage(rawBuffer, contentKey);
    } else {
      encryptedBuffer = this.encryptPdfEnvelope(rawBuffer, contentKey);
    }

    const uniqueName = `${Date.now()}_pkg_${crypto.randomUUID()}.${format.toLowerCase()}`;
    const encryptedRelPath = `encrypted/${uniqueName}`;
    const encryptedAbsPath = storageService.getAbsolutePath(encryptedRelPath);

    await fs.promises.writeFile(encryptedAbsPath, encryptedBuffer);

    const checksum = crypto.createHash('sha256').update(encryptedBuffer).digest('hex');

    return {
      encryptedStoragePath: encryptedRelPath,
      fileSizeBytes: encryptedBuffer.length,
      checksum,
    };
  }

  private encryptEpubPackage(epubBuffer: Buffer, contentKey: Buffer): Buffer {
    const zip = new AdmZip(epubBuffer);
    const zipEntries = zip.getEntries();
    const newZip = new AdmZip();

    for (const entry of zipEntries) {
      const entryName = entry.entryName;

      // EPUB specification requires mimetype and META-INF/container.xml to stay unencrypted
      if (
        entryName === 'mimetype' ||
        entryName === 'META-INF/container.xml' ||
        entryName.endsWith('/')
      ) {
        newZip.addFile(entryName, entry.getData());
        continue;
      }

      // Encrypt chapter HTML, CSS, fonts, images
      const rawData = entry.getData();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', contentKey, iv);
      const encryptedData = Buffer.concat([iv, cipher.update(rawData), cipher.final()]);

      newZip.addFile(entryName, encryptedData);
    }

    // Injected Readium LCP encryption.xml indicator
    const encryptionXml = `<?xml version="1.0" encoding="UTF-8"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#">
  <EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#">
    <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
    <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
      <KeyName>Avazas DRM Readium LCP Protected</KeyName>
    </KeyInfo>
    <CipherData>
      <CipherReference URI="*"/>
    </CipherData>
  </EncryptedData>
</encryption>`;

    newZip.addFile('META-INF/encryption.xml', Buffer.from(encryptionXml, 'utf-8'));
    return newZip.toBuffer();
  }

  private encryptPdfEnvelope(pdfBuffer: Buffer, contentKey: Buffer): Buffer {
    const iv = crypto.randomBytes(12); // GCM 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', contentKey, iv);
    const encrypted = Buffer.concat([cipher.update(pdfBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Custom Secure Avazas Envelope Header
    const magicHeader = Buffer.from('AVZ_DRM_PDF_V1\0');
    return Buffer.concat([magicHeader, iv, authTag, encrypted]);
  }
}

export const drmService = new DrmService();
