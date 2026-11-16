import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class RefreshToken extends Model {
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare deviceInfo?: string | null;
  declare ipAddress?: string | null;
  declare expiresAt: Date;
  declare isRevoked: boolean;
  declare readonly createdAt: Date;
}

RefreshToken.init(
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
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'token_hash',
    },
    deviceInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_info',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_revoked',
    },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    updatedAt: false,
  }
);

export default RefreshToken;
