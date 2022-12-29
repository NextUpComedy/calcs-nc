import winston, { transports } from 'winston';

const format = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.message}`),
);

const logger = winston.createLogger({
  level: 'info',
  format,
  transports: [new transports.Console()],
});

export default logger;
