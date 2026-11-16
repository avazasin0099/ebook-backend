import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Publisher extends Model {
  declare id: string;
  declare name: string;
  declare description?: string | null;
  declare logoUrl?: string | null;
  declare contactEmail?: string | null;
  declare website?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Publisher.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'logo_url',
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'contact_email',
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'publishers',
  }
);

export default Publisher;
