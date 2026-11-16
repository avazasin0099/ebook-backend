import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Author extends Model {
  declare id: string;
  declare name: string;
  declare biography?: string | null;
  declare photoUrl?: string | null;
  declare website?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Author.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'photo_url',
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'authors',
  }
);

export default Author;
