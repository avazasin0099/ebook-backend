import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadedFileResult {
  storagePath: string;
  fileSizeBytes: number;
  checksumSha256: string;
  mimeType: string;
}

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || './uploads');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const subdirs = ['covers', 'previews', 'raw', 'encrypted'];
    for (const sub of subdirs) {
      const fullPath = path.join(this.baseDir, sub);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  public async saveLocalFile(
    fileBuffer: Buffer,
    folder: 'covers' | 'previews' | 'raw' | 'encrypted',
    originalName: string
  ): Promise<UploadedFileResult> {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueName = `${Date.now()}_${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(this.baseDir, folder, uniqueName);

    await fs.promises.writeFile(destinationPath, fileBuffer);

    const checksumSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      storagePath: path.join(folder, uniqueName).replace(/\\/g, '/'),
      fileSizeBytes: fileBuffer.length,
      checksumSha256,
      mimeType: this.getMimeType(ext),
    };
  }

  public getAbsolutePath(storagePath: string): string {
    return path.join(this.baseDir, storagePath);
  }

  public async fileExists(storagePath: string): Promise<boolean> {
    const fullPath = this.getAbsolutePath(storagePath);
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  public async readStream(storagePath: string): Promise<fs.ReadStream> {
    const fullPath = this.getAbsolutePath(storagePath);
    return fs.createReadStream(fullPath);
  }

  private getMimeType(ext: string): string {
    switch (ext) {
      case '.epub':
        return 'application/epub+zip';
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }
}

export const storageService = new StorageService();
