import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Order extends Model {
  declare id: string;
  declare userId: string;
  declare orderNumber: string;
  declare totalAmount: number;
  declare discountAmount: number;
  declare netAmount: number;
  declare currency: string;
  declare status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
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
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'order_number',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'discount_amount',
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'net_amount',
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED']],
      },
    },
  },
  {
    sequelize,
    tableName: 'orders',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Order;
