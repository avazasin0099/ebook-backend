import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class BookAuthor extends Model {
  declare id: string;
  declare bookId: string;
  declare authorId: string;
  declare role: 'PRIMARY_AUTHOR' | 'CO_AUTHOR' | 'EDITOR';
  declare readonly createdAt: Date;
}

BookAuthor.init(
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
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'author_id',
    },
    role: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PRIMARY_AUTHOR',
      validate: {
        isIn: [['PRIMARY_AUTHOR', 'CO_AUTHOR', 'EDITOR']],
      },
    },
  },
  {
    sequelize,
    tableName: 'book_authors',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['book_id', 'author_id'],
      },
    ],
  }
);

export default BookAuthor;
