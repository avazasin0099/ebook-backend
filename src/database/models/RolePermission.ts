import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class RolePermission extends Model {
  declare id: string;
  declare roleId: string;
  declare permissionId: string;
  declare readonly createdAt: Date;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id',
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id',
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id'],
      },
    ],
  }
);

export default RolePermission;
