import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class DrmDownload extends Model {
  declare id: string;
  declare licenseId: string;
  declare deviceId: string;
  declare ipAddress?: string | null;
  declare downloadToken: string;
  declare tokenExpiresAt: Date;
  declare isCompleted: boolean;
  declare completedAt?: Date | null;
  declare readonly createdAt: Date;
}

DrmDownload.init(
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
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    downloadToken: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'download_token',
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'token_expires_at',
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_completed',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'drm_downloads',
    updatedAt: false,
  }
);

export default DrmDownload;
