import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class DrmLicenseEvent extends Model {
  declare id: string;
  declare licenseId: string;
  declare deviceId?: string | null;
  declare eventType: 'ISSUED' | 'VALIDATED' | 'RENEWED' | 'REVOKED' | 'TAMPER_DETECTED';
  declare eventMetadata?: object | null;
  declare readonly createdAt: Date;
}

DrmLicenseEvent.init(
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
      allowNull: true,
      field: 'device_id',
    },
    eventType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'event_type',
      validate: {
        isIn: [['ISSUED', 'VALIDATED', 'RENEWED', 'REVOKED', 'TAMPER_DETECTED']],
      },
    },
    eventMetadata: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'event_metadata',
    },
  },
  {
    sequelize,
    tableName: 'drm_license_events',
    updatedAt: false,
    indexes: [
      { fields: ['license_id'] },
      { fields: ['event_type'] },
    ],
  }
);

export default DrmLicenseEvent;
