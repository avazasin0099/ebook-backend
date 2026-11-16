import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class BookFile extends Model {
  declare id: string;
  declare bookId: string;
  declare format: 'EPUB' | 'PDF';
  declare rawStoragePath: string;
  declare encryptedStoragePath?: string | null;
  declare fileSizeBytes: number;
  declare checksumSha256?: string | null;
  declare encryptionAlgorithm: string;
  declare encryptionKeyId?: string | null;
  declare isProcessed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BookFile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'book_id',
    },
    format: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['EPUB', 'PDF']],
      },
    },
    rawStoragePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'raw_storage_path',
    },
    encryptedStoragePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'encrypted_storage_path',
    },
    fileSizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'file_size_bytes',
    },
    checksumSha256: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'checksum_sha256',
    },
    encryptionAlgorithm: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'AES-256-CBC',
      field: 'encryption_algorithm',
    },
    encryptionKeyId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'encryption_key_id',
    },
    isProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_processed',
    },
  },
  {
    sequelize,
    tableName: 'book_files',
    indexes: [
      {
        unique: true,
        fields: ['book_id', 'format'],
      },
    ],
  }
);

export default BookFile;
