import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class DrmDeviceAuthorization extends Model {
  declare id: string;
  declare licenseId: string;
  declare deviceId: string;
  declare authorizedAt: Date;
  declare expiresAt?: Date | null;
  declare status: 'ACTIVE' | 'REVOKED';
  declare readonly createdAt: Date;
}

DrmDeviceAuthorization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    licenseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'license_id',
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'device_id',
    },
    authorizedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'authorized_at',
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
        isIn: [['ACTIVE', 'REVOKED']],
      },
    },
  },
  {
    sequelize,
    tableName: 'drm_device_authorizations',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['license_id', 'device_id'],
      },
    ],
  }
);

export default DrmDeviceAuthorization;
