import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class PlatformSetting extends Model {
  declare key: string;
  declare value: object;
  declare description?: string | null;
  declare readonly updatedAt: Date;
}

PlatformSetting.init(
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'platform_settings',
    createdAt: false,
  }
);

export default PlatformSetting;
