import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class UserDevice extends Model {
  declare id: string;
  declare userId: string;
  declare deviceIdentifier: string;
  declare deviceName: string;
  declare deviceModel: string;
  declare osVersion?: string | null;
  declare appVersion?: string | null;
  declare devicePublicKey?: string | null;
  declare status: 'ACTIVE' | 'REVOKED' | 'BLOCKED';
  declare registeredAt: Date;
  declare lastSeenAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    deviceIdentifier: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'device_identifier',
    },
    deviceName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'device_name',
    },
    deviceModel: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'device_model',
    },
    osVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'os_version',
    },
    appVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'app_version',
    },
    devicePublicKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'device_public_key',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'REVOKED', 'BLOCKED']],
      },
    },
    registeredAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'registered_at',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_seen_at',
    },
  },
  {
    sequelize,
    tableName: 'user_devices',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'device_identifier'],
      },
    ],
  }
);

export default UserDevice;
