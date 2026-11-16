import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class BookPublisher extends Model {
  declare id: string;
  declare bookId: string;
  declare publisherId: string;
  declare readonly createdAt: Date;
}

BookPublisher.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'book_id',
    },
    publisherId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'publisher_id',
    },
  },
  {
    sequelize,
    tableName: 'book_publishers',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['book_id', 'publisher_id'],
      },
    ],
  }
);

export default BookPublisher;
