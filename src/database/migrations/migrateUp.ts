import { sequelize, migration as umzug } from 'db-models-nc';

(async (): Promise<void> => {
  await umzug.up();
  sequelize.close();
})();
