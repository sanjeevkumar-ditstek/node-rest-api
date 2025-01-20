import winston from 'winston';

const { combine, timestamp, printf, colorize, metadata } = winston.format;

// Define custom colors for winston (optional)
winston.addColors({
  error: 'red',
  info: 'green',
  warn: 'yellow',
  debug: 'blue',
});

const logConfiguration = {
  transports: [
    new winston.transports.Console({
      level: 'warn', // Only log warn and above for this transport
    }),
    new winston.transports.Console({
      level: 'info', // Only log info and above for this transport
    }),
    new winston.transports.File({
      level: 'error',
      //filename: 'logs/error.log', // Log errors to file
    }),
  ],
  format: combine(
    colorize({ all: true }), // Enable colorization for all logs
    metadata(), // Include metadata in logs
    timestamp(), // Include timestamp in logs
    printf(({ timestamp, level, message, metadata }) => {
      return `[${timestamp}] ${level}: ${message} :${JSON.stringify(metadata)}`;
    })
  ),
};

const logger = winston.createLogger(logConfiguration);
logger.info('Starting logging service');

export default logger;
