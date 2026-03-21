import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment or use default
const getConnectionString = () => {
    const url = process.env.DATABASE_URL;

    if (url) {
        return url;
    }

    // Construct from individual env vars
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const name = process.env.DB_NAME || 'laboratory_inventory';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres';

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

export const db = drizzle(client, { schema });

export * from './schema';
