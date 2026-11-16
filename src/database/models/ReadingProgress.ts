import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class ReadingProgress extends Model {
  declare id: string;
  declare userId: string;
  declare bookId: string;
  declare locatorJson: string;
  declare percentageComplete: number;
  declare currentPage?: number | null;
  declare totalPages?: number | null;
  declare lastReadAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ReadingProgress.init(
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
    percentageComplete: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      field: 'percentage_complete',
    },
    currentPage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'current_page',
    },
    totalPages: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_pages',
    },
    lastReadAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_read_at',
    },
  },
  {
    sequelize,
    tableName: 'reading_progress',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'book_id'],
      },
    ],
  }
);

export default ReadingProgress;
