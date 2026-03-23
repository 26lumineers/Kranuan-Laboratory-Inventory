import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { createLogger, getTraceId, type Logger } from '@laboratory/shared';

// Create logger for database queries
const isJsonFormat = process.env.LOG_JSON === 'true';
const dbLogger: Logger = createLogger(isJsonFormat);

// Custom query logger for Drizzle
const queryLogger = {
    logQuery: (query: string, params: unknown[]): void => {
        const traceId = getTraceId();
        dbLogger.debug({
            message: 'query',
            sql: query,
            params: params.length > 0 ? params : undefined,
            traceId,
        });
    },
};

interface DatabaseConfig {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
}

interface YamlConfig {
    database: DatabaseConfig;
}

// Resolve config path - navigate from current file location to project root
const getConfig = async (): Promise<YamlConfig> => {
    // packages/db/src -> project root is 3 levels up
    const projectRoot = import.meta.dir.replace('/packages/db/src', '');
    const configPath = `${projectRoot}/apps/server/config/default.yaml`;
    const file = Bun.file(configPath);

    if (!(await file.exists())) {
        throw new Error(`Config file not found: ${configPath}`);
    }

    const content = await file.text();
    return Bun.YAML.parse(content) as YamlConfig;
};

const config = await getConfig();

if (!config.database) {
    throw new Error('Database config not found in default.yaml');
}

// Get database URL from yaml config
const getConnectionString = (): string => {
    // Allow DATABASE_URL env var to override
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const db = config.database;

    // Use url from yaml if provided
    if (db.url) return db.url;

    // Build from individual fields
    const { host, port, name, user, password } = db;

    if (!host || !port || !name || !user || !password) {
        throw new Error('Incomplete database config in default.yaml');
    }

    return `postgres://${user}:${password}@${host}:${port}/${name}`;
};

const connectionString = getConnectionString();

// Configure connection based on environment
const isProduction = process.env.NODE_ENV === 'production';

const client = postgres(connectionString, {
    max: isProduction ? 20 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export const db = drizzle(client, { schema, logger: queryLogger });

/**
 * Wait for database to be ready by pinging it with retries
 * Uses values from config if available, otherwise defaults
 * @returns Promise that resolves when database is ready
 */
export const waitForDatabase = async (): Promise<void> => {
    // Get health check settings from config or use defaults
    const healthCheck = (config as YamlConfig & { database: { healthCheck?: { maxRetries?: number; retryDelayMs?: number } } }).database?.healthCheck;
    const maxRetries = healthCheck?.maxRetries ?? 30;
    const retryDelayMs = healthCheck?.retryDelayMs ?? 1000;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Try a simple query to check connection
            await client`SELECT 1`;
            dbLogger.info({
                message: '📦 Database_connected',
                attempt,
            });
            return;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            dbLogger.warn({
                message: 'database_connection_attempt_failed',
                attempt,
                maxRetries,
                error: lastError.message,
            });

            if (attempt < maxRetries) {
                // Exponential backoff with max of 5 seconds
                const delay = Math.min(retryDelayMs * Math.pow(1.5, attempt - 1), 5000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(
        `Failed to connect to database after ${maxRetries} attempts. Last error: ${lastError?.message}`
    );
};

export * from './schema';
export * from './utils';
export * from './model';
