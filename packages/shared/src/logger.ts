import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

// Trace ID context storage
export const traceContext = new AsyncLocalStorage<string>();

export const generateTraceId = (): string => crypto.randomUUID();

export const getTraceId = (): string | undefined => traceContext.getStore();

// Colors for pretty output
const colors = {
    error: '\x1b[31m', // red
    warn: '\x1b[33m',  // yellow
    info: '\x1b[36m',  // cyan
    debug: '\x1b[90m', // gray
    reset: '\x1b[0m',
    bright: '\x1b[1m',
};

const levelColor = (level: string): string => {
    return colors[level as keyof typeof colors] || colors.reset;
};

// Pretty format for development
const prettyFormat = winston.format.printf(({ timestamp, level, message, traceId, ...meta }) => {
    const color = levelColor(level);
    const reset = colors.reset;
    const bright = colors.bright;
    const gray = colors.debug;

    const tracePart = traceId ? `${gray}[${traceId}]${reset} ` : '';
    const metaPart = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return `${gray}${timestamp}${reset} ${tracePart}${bright}${color}${level.toUpperCase()}${reset} ${message}${metaPart}`;
});

// Create logger instance
export const createLogger = (jsonFormat: boolean): winston.Logger => {
    return winston.createLogger({
        level: 'debug',
        format: jsonFormat
            ? winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json()
              )
            : winston.format.combine(
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                  prettyFormat
              ),
        transports: [new winston.transports.Console()],
    });
};

// Logger type for convenience
export type Logger = winston.Logger;
