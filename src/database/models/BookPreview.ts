import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class BookPreview extends Model {
  declare id: string;
  declare bookId: string;
  declare previewType: 'SAMPLE_PDF' | 'SAMPLE_EPUB';
  declare storagePath: string;
  declare pageCount: number;
  declare readonly createdAt: Date;
}

BookPreview.init(
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
    previewType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'SAMPLE_PDF',
      field: 'preview_type',
    },
    storagePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'storage_path',
    },
    pageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      field: 'page_count',
    },
  },
  {
    sequelize,
    tableName: 'book_previews',
    updatedAt: false,
  }
);

export default BookPreview;
