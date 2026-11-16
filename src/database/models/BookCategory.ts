import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class BookCategory extends Model {
  declare id: string;
  declare bookId: string;
  declare categoryId: string;
  declare readonly createdAt: Date;
}

BookCategory.init(
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'category_id',
    },
  },
  {
    sequelize,
    tableName: 'book_categories',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['book_id', 'category_id'],
      },
    ],
  }
);

export default BookCategory;
