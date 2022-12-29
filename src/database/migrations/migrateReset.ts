import { sequelize, migration as umzug } from 'db-models-nc';

(async (): Promise<void> => {
  await umzug.down({ to: 0 });
  sequelize.close();
})();
