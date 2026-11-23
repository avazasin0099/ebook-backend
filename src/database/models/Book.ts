import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Book extends Model {
  declare id: string;
  declare title: string;
  declare slug: string;
  declare subtitle?: string | null;
  declare description: string;
  declare isbn?: string | null;
  declare language: string;
  declare pageCount?: number | null;
  declare publishedDate?: Date | null;
  declare basePrice: number;
  declare salePrice: number;
  declare currency: string;
  declare status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  declare coverImageUrl?: string | null;
  declare availableFormats: string;
  declare isFeatured: boolean;
  declare className?: string | null;
  declare subject?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date | null;
}

Book.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: true,
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isbn: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true,
    },
    language: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'en',
    },
    pageCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'page_count',
    },
    publishedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'published_date',
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price',
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'sale_price',
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'DRAFT',
      validate: {
        isIn: [['DRAFT', 'PUBLISHED', 'ARCHIVED']],
      },
    },
    coverImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'cover_image_url',
    },
    availableFormats: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'EPUB,PDF',
      field: 'available_formats',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured',
    },
    className: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'class_name',
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'books',
    paranoid: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['language'] },
      { fields: ['is_featured'] },
      { fields: ['class_name'] },
      { fields: ['subject'] },
    ],
  }
);

export default Book;
