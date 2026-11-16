import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class DrmLicense extends Model {
  declare id: string;
  declare purchaseId: string;
  declare userId: string;
  declare bookId: string;
  declare licenseKeyId: string;
  declare licenseProvider: string;
  declare licenseDocument: object;
  declare issuedAt: Date;
  declare expiresAt?: Date | null;
  declare status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DrmLicense.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'purchase_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'book_id',
    },
    licenseKeyId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'license_key_id',
    },
    licenseProvider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'READIUM_LCP',
      field: 'license_provider',
    },
    licenseDocument: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'license_document',
    },
    issuedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'issued_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'EXPIRED', 'REVOKED']],
      },
    },
  },
  {
    sequelize,
    tableName: 'drm_licenses',
    indexes: [
      { fields: ['user_id', 'book_id'] },
      { fields: ['status'] },
    ],
  }
);

export default DrmLicense;
