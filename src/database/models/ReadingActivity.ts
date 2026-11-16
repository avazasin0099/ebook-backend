import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class ReadingActivity extends Model {
  declare id: string;
  declare userId: string;
  declare bookId: string;
  declare deviceId?: string | null;
  declare durationSeconds: number;
  declare sessionStart: Date;
  declare sessionEnd: Date;
  declare readonly createdAt: Date;
}

ReadingActivity.init(
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
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'book_id',
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'device_id',
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'duration_seconds',
    },
    sessionStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'session_start',
    },
    sessionEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'session_end',
    },
  },
  {
    sequelize,
    tableName: 'reading_activity',
    updatedAt: false,
    indexes: [
      { fields: ['user_id', 'book_id'] },
    ],
  }
);

export default ReadingActivity;
