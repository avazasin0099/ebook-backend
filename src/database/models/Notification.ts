import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Notification extends Model {
  declare id: string;
  declare userId: string;
  declare title: string;
  declare message: string;
  declare type: 'INFO' | 'TRANSACTION' | 'SECURITY';
  declare isRead: boolean;
  declare readonly createdAt: Date;
}

Notification.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'INFO',
      validate: {
        isIn: [['INFO', 'TRANSACTION', 'SECURITY']],
      },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
    ],
  }
);

export default Notification;
