import { sequelize } from 'db-models-nc';
import { logger } from '../../utilities';

const { NODE_ENV } = process.env;

const buildDB = async ():Promise<void> => {
  await sequelize.sync({ force: true });
};
(async (): Promise<void> => {
  if (NODE_ENV === 'development') {
    try {
      await buildDB();
      logger.info('Fake data has been built');
    } catch (err) {
      logger.error('Error while building Database');
    } finally {
      await sequelize.close();
    }
  }
})();

export default buildDB;
