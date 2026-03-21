import { parse } from 'yaml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// =============================================================================
// Config Types
// =============================================================================

export type JwtAlgorithm = 'RS256' | 'RS512';

export interface Config {
    server: {
        port: number;
        host: string;
    };
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        url: string;
        poolSize: number;
        ssl: boolean;
    };
    jwt: {
        secret: string;
        expiresIn: number;
        algorithm: JwtAlgorithm;
        privateKeyPath: string;
        publicKeyPath: string;
    };
    logging: {
        jsonFormat: boolean;
        level: string;
        requests: boolean;
    };
    cors: {
        enabled: boolean;
        origins: string[];
        methods: string[];
        headers: string[];
    };
    dashboard: {
        stock: {
            warningLevel: number;
            criticalLevel: number;
            outOfStockLevel: number;
        };
        alerts: {
            enableLowStock: boolean;
            enableOutOfStock: boolean;
        };
    };
}

// =============================================================================
// Config Loader
// =============================================================================

const env = process.env.NODE_ENV || 'development';
const configDir = join(process.cwd(), 'config');

// Load YAML file
function loadYaml(filename: string): Config {
    const path = join(configDir, filename);
    if (!existsSync(path)) {
        throw new Error(`Config file not found: ${path}`);
    }
    const content = readFileSync(path, 'utf-8');
    return parse(content) as Config;
}

// Merge two objects (source overrides target)
function merge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        const value = source[key];
        if (value !== undefined) {
            if (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value) &&
                typeof target[key] === 'object' &&
                target[key] !== null
            ) {
                result[key] = merge(target[key] as object, value as object) as T[Extract<keyof T, string>];
            } else {
                result[key] = value as T[Extract<keyof T, string>];
            }
        }
    }
    return result;
}

// Load and merge configs
const defaultConfig = loadYaml('default.yaml');
const envConfig = existsSync(join(configDir, `${env}.yaml`)) ? loadYaml(`${env}.yaml`) : {};

// Final config (env overrides default)
export const config: Config = merge(defaultConfig, envConfig);

// =============================================================================
// Database URL Helper
// =============================================================================

export function getDatabaseUrl(): string {
    if (config.database.url) {
        return config.database.url;
    }
    const { host, port, name, user, password } = config.database;
    return `postgres://${user}:${password}@${host}:${port}/${name}`;
}

// =============================================================================
// Startup Log
// =============================================================================

if (env === 'development') {
    console.log(`Config loaded: ${env}`);
    console.log(`Server: ${config.server.host}:${config.server.port}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`JWT: ${config.jwt.algorithm}, expires in ${config.jwt.expiresIn}s`);
}
