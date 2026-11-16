import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dialect = (process.env.DB_DIALECT || 'postgres') as 'postgres' | 'sqlite';
const logging = process.env.DB_LOGGING === 'true' ? console.log : false;

let sequelize: Sequelize;

if (dialect === 'sqlite') {
  const storage = process.env.SQLITE_STORAGE || path.resolve(process.cwd(), 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: false,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'avazas_books',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging,
      pool: {
        max: 20,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        paranoid: false,
      },
    }
  );
}

export default sequelize;
