import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class SupportTicket extends Model {
  declare id: string;
  declare userId: string;
  declare subject: string;
  declare message: string;
  declare status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  declare priority: 'LOW' | 'MEDIUM' | 'HIGH';
  declare adminNotes?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupportTicket.init(
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
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'OPEN',
      validate: {
        isIn: [['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']],
      },
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'MEDIUM',
      validate: {
        isIn: [['LOW', 'MEDIUM', 'HIGH']],
      },
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },
  },
  {
    sequelize,
    tableName: 'support_tickets',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
    ],
  }
);

export default SupportTicket;
