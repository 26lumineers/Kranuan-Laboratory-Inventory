import { parse } from 'yaml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ServerConfig {
    port: number;
    host: string;
}

export interface DatabaseConfig {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
    poolSize: number;
    ssl: boolean;
}

export type JwtAlgorithm = 'RS256' | 'RS512';

export interface JwtConfig {
    secret: string;
    expiresIn: number;
    algorithm: JwtAlgorithm;
    privateKey?: string;
    publicKey?: string;
}

export interface LoggingConfig {
    jsonFormat: boolean;
    level: string;
    requests: boolean;
}

export interface CorsConfig {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers: string[];
}

export interface DashboardStockConfig {
    warningLevel: number;    // Percentage (e.g., 50 = 50% of threshold)
    criticalLevel: number;   // Percentage (e.g., 25 = 25% of threshold)
    outOfStockLevel: number; // Percentage (e.g., 0 = 0%)
}

export interface DashboardAlertsConfig {
    enableLowStock: boolean;
    enableOutOfStock: boolean;
}

export interface DashboardConfig {
    stock: DashboardStockConfig;
    alerts: DashboardAlertsConfig;
}

export interface Config {
    server: ServerConfig;
    database: DatabaseConfig;
    jwt: JwtConfig;
    logging: LoggingConfig;
    cors: CorsConfig;
    dashboard: DashboardConfig;
}

/**
 * Substitute environment variables in a string
 * Format: ${ENV_VAR:default_value}
 */
function substituteEnvVars(value: string): string {
    const envVarPattern = /\$\{([^}:]+)(?::([^}]*))?\}/g;

    return value.replace(envVarPattern, (_, envVar, defaultValue) => {
        const envValue = process.env[envVar];
        if (envValue !== undefined) {
            return envValue;
        }
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        return '';
    });
}

/**
 * Recursively substitute environment variables in an object
 */
function substituteEnvVarsInObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
        return substituteEnvVars(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(substituteEnvVarsInObject);
    }
    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = substituteEnvVarsInObject(value);
        }
        return result;
    }
    return obj;
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key of Object.keys(source) as (keyof T)[]) {
        const sourceValue = source[key];
        const targetValue = target[key];
        if (
            sourceValue !== undefined &&
            sourceValue !== null &&
            typeof sourceValue === 'object' &&
            !Array.isArray(sourceValue) &&
            targetValue !== undefined &&
            typeof targetValue === 'object' &&
            !Array.isArray(targetValue)
        ) {
            result[key] = deepMerge(
                targetValue as Record<string, unknown>,
                sourceValue as Record<string, unknown>
            ) as T[keyof T];
        } else if (sourceValue !== undefined) {
            result[key] = sourceValue as T[keyof T];
        }
    }
    return result;
}

/**
 * Load and parse a YAML configuration file
 */
function loadYamlFile(filePath: string): Record<string, unknown> {
    if (!existsSync(filePath)) {
        return {};
    }
    const content = readFileSync(filePath, 'utf-8');
    return parse(content) || {};
}

/**
 * Get the database connection URL
 */
export function getDatabaseUrl(config: DatabaseConfig): string {
    // If full URL is provided, use it
    if (config.url) {
        return config.url;
    }
    // Otherwise, construct from individual fields
    return `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.name}`;
}

// Config directory path
const configDir = join(process.cwd(), 'config');

// Determine environment
const env = process.env.NODE_ENV || 'development';

// Load configuration files in order: default -> environment
const defaultConfig = loadYamlFile(join(configDir, 'default.yaml'));
const envConfig = loadYamlFile(join(configDir, `${env}.yaml`));

// Merge configurations (environment overrides default)
const mergedConfig = deepMerge(
    defaultConfig as Record<string, unknown>,
    envConfig as Record<string, unknown>
);

// Substitute environment variables
const rawConfig = substituteEnvVarsInObject(mergedConfig) as Config;

// Export the final configuration
export const config: Config = rawConfig;

// Log configuration on load (in development)
if (env === 'development') {
    console.log(`Loaded configuration for environment: ${env}`);
    console.log(`Server: ${config.server.host}:${config.server.port}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`JWT expires in: ${config.jwt.expiresIn}s`);
}
