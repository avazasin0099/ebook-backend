import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class OrderItem extends Model {
  declare id: string;
  declare orderId: string;
  declare bookId: string;
  declare price: number;
  declare discount: number;
  declare netPrice: number;
  declare readonly createdAt: Date;
}

OrderItem.init(
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
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'book_id',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    netPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'net_price',
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    updatedAt: false,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['book_id'] },
    ],
  }
);

export default OrderItem;
