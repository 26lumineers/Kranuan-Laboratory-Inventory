import type { Config } from 'drizzle-kit';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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

// Parse YAML manually (simple parser for config file)
const parseYaml = (content: string): YamlConfig => {
    const lines = content.split('\n');
    const result: Record<string, unknown> = {};
    let currentKey = '';
    let nestedKey = '';

    for (const line of lines) {
        const trimmed = line.trimEnd();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = line.search(/\S/);
        const colonIndex = trimmed.indexOf(':');

        if (colonIndex === -1) continue;

        const key = trimmed.substring(0, colonIndex).trim();
        let value: string | undefined = trimmed.substring(colonIndex + 1).trim();

        if (indent === 0) {
            currentKey = key;
            nestedKey = '';
            if (value) {
                // Parse value
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value === 'true') {
                    (result as Record<string, unknown>)[key] = true;
                    continue;
                } else if (value === 'false') {
                    (result as Record<string, unknown>)[key] = false;
                    continue;
                } else if (!isNaN(Number(value))) {
                    (result as Record<string, unknown>)[key] = Number(value);
                    continue;
                }
                (result as Record<string, unknown>)[key] = value;
            } else {
                (result as Record<string, unknown>)[key] = {};
            }
        } else if (indent === 2) {
            nestedKey = key;
            if (value) {
                // Parse value
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value === 'true') {
                    ((result as Record<string, Record<string, unknown>>)[currentKey] as Record<string, unknown>)[key] = true;
                    continue;
                } else if (value === 'false') {
                    ((result as Record<string, Record<string, unknown>>)[currentKey] as Record<string, unknown>)[key] = false;
                    continue;
                } else if (!isNaN(Number(value))) {
                    ((result as Record<string, Record<string, unknown>>)[currentKey] as Record<string, unknown>)[key] = Number(value);
                    continue;
                }
                ((result as Record<string, Record<string, unknown>>)[currentKey] as Record<string, unknown>)[key] = value;
            }
        }
    }

    return result as unknown as YamlConfig;
};

// Resolve config path synchronously
const getConfig = (): YamlConfig => {
    // Use environment variable or default path
    const configPath = process.env.CONFIG_PATH || resolve(__dirname, '../../apps/server/config/default.yaml');

    if (!existsSync(configPath)) {
        // Return default config if file not found
        return {
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 5432,
                name: process.env.DB_NAME || 'laboratory_inventory',
                user: process.env.DB_USER || 'lab_user',
                password: process.env.DB_PASSWORD || 'strongpassword',
                url: process.env.DATABASE_URL || '',
            }
        };
    }

    const content = readFileSync(configPath, 'utf-8');

    // Try to use Bun's YAML parser if available, otherwise use simple parser
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (globalThis as any).Bun !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (globalThis as any).Bun.YAML.parse(content) as YamlConfig;
        }
    } catch {
        // Fall through to simple parser
    }

    return parseYaml(content);
};

const yamlConfig = getConfig();

if (!yamlConfig.database) {
    throw new Error('Database config not found in default.yaml');
}

// Build connection string from yaml config
const getConnectionString = (): string => {
    // Allow DATABASE_URL env var to override
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const db = yamlConfig.database;

    // Use url from yaml if provided
    if (db.url) return db.url;

    // Build from individual fields
    const { host, port, name, user, password } = db;

    if (!host || !port || !name || !user || !password) {
        throw new Error('Incomplete database config in default.yaml');
    }

    return `postgres://${user}:${password}@${host}:${port}/${name}`;
};

export default {
    schema: './src/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: getConnectionString(),
    },
} satisfies Config;
