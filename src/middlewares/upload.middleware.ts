import multer from 'multer';
import { BadRequestError } from '../utils/errors';

const storage = multer.memoryStorage();

export const uploadCover = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only JPG, PNG, and WebP images are allowed for cover images', 'INVALID_FILE_TYPE'));
    }
  },
});

export const uploadManuscript = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/epub+zip', 'application/octet-stream'];
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.epub') || ext.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only EPUB and PDF files are allowed for publications', 'INVALID_FILE_TYPE'));
    }
  },
});

export const uploadBookFiles = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (file.fieldname === 'cover') {
      const allowedCovers = ['.jpg', '.jpeg', '.png', '.webp'];
      if (allowedCovers.some((e) => ext.endsWith(e))) return cb(null, true);
      return cb(new BadRequestError('Invalid cover image format', 'INVALID_FILE_TYPE'));
    }

    if (file.fieldname === 'manuscript' || file.fieldname === 'preview') {
      if (ext.endsWith('.epub') || ext.endsWith('.pdf')) return cb(null, true);
      return cb(new BadRequestError('Invalid publication format. Must be EPUB or PDF', 'INVALID_FILE_TYPE'));
    }

    cb(new BadRequestError(`Unexpected upload field: ${file.fieldname}`, 'INVALID_FIELD'));
  },
});
