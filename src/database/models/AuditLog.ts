import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class AuditLog extends Model {
  declare id: string;
  declare userId?: string | null;
  declare action: string;
  declare entityType: string;
  declare entityId?: string | null;
  declare oldValues?: object | null;
  declare newValues?: object | null;
  declare ipAddress?: string | null;
  declare userAgent?: string | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'entity_id',
    },
    oldValues: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'old_values',
    },
    newValues: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'new_values',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'user_agent',
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['entity_type'] },
      { fields: ['created_at'] },
    ],
  }
);

export default AuditLog;
