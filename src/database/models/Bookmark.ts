import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Bookmark extends Model {
  declare id: string;
  declare userId: string;
  declare bookId: string;
  declare locatorJson: string;
  declare title?: string | null;
  declare note?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Bookmark.init(
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
    locatorJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'locator_json',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'bookmarks',
    indexes: [
      { fields: ['user_id', 'book_id'] },
    ],
  }
);

export default Bookmark;
