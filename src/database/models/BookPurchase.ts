import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class BookPurchase extends Model {
  declare id: string;
  declare userId: string;
  declare bookId: string;
  declare orderId: string;
  declare entitlementStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  declare grantedAt: Date;
  declare expiresAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BookPurchase.init(
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
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'book_id',
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
    },
    entitlementStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE',
      field: 'entitlement_status',
      validate: {
        isIn: [['ACTIVE', 'REVOKED', 'EXPIRED']],
      },
    },
    grantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'granted_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'book_purchases',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'book_id', 'entitlement_status'],
      },
      { fields: ['order_id'] },
    ],
  }
);

export default BookPurchase;
