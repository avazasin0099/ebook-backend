import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Permission extends Model {
  declare id: string;
  declare name: string;
  declare module: string;
  declare description: string;
  declare readonly createdAt: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    updatedAt: false,
  }
);

export default Permission;
