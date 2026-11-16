import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Refund extends Model {
  declare id: string;
  declare paymentId: string;
  declare cashfreeRefundId: string;
  declare refundAmount: number;
  declare reason?: string | null;
  declare status: 'PENDING' | 'PROCESSED' | 'FAILED';
  declare processedAt?: Date | null;
  declare readonly createdAt: Date;
}

Refund.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payment_id',
    },
    cashfreeRefundId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'cashfree_refund_id',
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'refund_amount',
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'PROCESSED', 'FAILED']],
      },
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },
  },
  {
    sequelize,
    tableName: 'refunds',
    updatedAt: false,
  }
);

export default Refund;
