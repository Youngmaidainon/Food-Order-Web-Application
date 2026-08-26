import pino from 'pino';

// Structured JSON Logger (Pino)
export const appLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  } : undefined,
  formatters: {
    level: (logLevelLabel) => {
      return { level: logLevelLabel };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
