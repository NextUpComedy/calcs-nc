import path from 'path';
import dotenv from 'dotenv';
import database from './database';
import system from './system';

if (!process.env.NODE_ENV) {
  throw new Error('You have to set NODE_ENV');
}

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(process.cwd(), `.env.${process.env.NODE_ENV}`) });
}

export default {
  database: database(),
  system: system(),
};
