import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Role extends Model {
  declare id: string;
  declare name: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  declare description: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isIn: [['SUPER_ADMIN', 'ADMIN', 'CUSTOMER']],
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'roles',
  }
);

export default Role;
