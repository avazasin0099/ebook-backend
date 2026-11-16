import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';
import Role from './Role';

export class User extends Model {
  declare id: string;
  declare roleId: string;
  declare email: string;
  declare phone?: string | null;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  declare emailVerified: boolean;
  declare phoneVerified: boolean;
  declare lastLoginAt?: Date | null;
  declare failedLoginAttempts: number;
  declare lockedUntil?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date | null;

  // Association mixins
  declare Role?: Role;
}

User.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']],
      },
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified',
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'phone_verified',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_login_attempts',
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'locked_until',
    },
  },
  {
    sequelize,
    tableName: 'users',
    paranoid: true,
  }
);

export default User;
