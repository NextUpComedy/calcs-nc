import { sequelize, migration as umzug } from 'nc-db-new';

(async (): Promise<void> => {
  await umzug.down({ to: 0 });
  sequelize.close();
})();
