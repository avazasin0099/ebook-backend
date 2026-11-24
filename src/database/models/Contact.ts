import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class Contact extends Model {
  declare id: string;
  declare name: string;
  declare phone: string;
  declare topic: string;
  declare message: string;
  declare submittedAt: Date;
  declare status: 'PENDING' | 'RESOLVED' | 'ARCHIVED';
  declare adminNotes?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'RESOLVED', 'ARCHIVED']],
      },
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },
  },
  {
    sequelize,
    tableName: 'contacts',
    indexes: [
      { fields: ['status'] },
      { fields: ['submitted_at'] },
      { fields: ['phone'] },
    ],
  }
);

export default Contact;
