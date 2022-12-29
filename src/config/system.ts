import Joi from 'joi';
import { ISystem } from '../interfaces';

const envVarsSchema = Joi.object({
  ENCRYPTION_SECRET_KEY: Joi.string().required(),
}).unknown().required();

const config = (): ISystem => {
  const { error, value: envVars } = envVarsSchema.validate(process.env);

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return {
    ENCRYPTION_SECRET_KEY: envVars.ENCRYPTION_SECRET_KEY,
  };
};

export default config;
