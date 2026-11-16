import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Payment extends Model {
  declare id: string;
  declare orderId: string;
  declare paymentGateway: string;
  declare cashfreeOrderId: string;
  declare cashfreePaymentId?: string | null;
  declare paymentMethod?: string | null;
  declare amount: number;
  declare currency: string;
  declare status: 'INITIALIZED' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED';
  declare rawWebhookPayload?: object | null;
  declare failureReason?: string | null;
  declare completedAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
    },
    paymentGateway: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'CASHFREE',
      field: 'payment_gateway',
    },
    cashfreeOrderId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'cashfree_order_id',
    },
    cashfreePaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: 'cashfree_payment_id',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'INITIALIZED',
      validate: {
        isIn: [['INITIALIZED', 'SUCCESS', 'FAILED', 'PENDING', 'USER_DROPPED']],
      },
    },
    rawWebhookPayload: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'raw_webhook_payload',
    },
    failureReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'failure_reason',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'payments',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['status'] },
    ],
  }
);

export default Payment;
