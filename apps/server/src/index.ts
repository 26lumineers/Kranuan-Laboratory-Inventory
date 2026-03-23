import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { createLogger, traceContext, generateTraceId, getTraceId } from '@laboratory/shared';
import { waitForDatabase } from '@laboratory/db';
import { config } from './infrastructure/config';
import { authRoutes } from './presentation/routes/auth';
import { productRoutes } from './presentation/routes/products';
import { transactionRoutes } from './presentation/routes/transactions';
import { userRoutes } from './presentation/routes/users';
import { roomRoutes } from './presentation/routes/rooms';
import { inventoryRoutes } from './presentation/routes/inventory';
import { notificationRoutes } from './presentation/routes/notifications';
import { reportRoutes } from './presentation/routes/reports';
import { orderRoutes } from './presentation/routes/orders';
import { dashboardRoutes } from './presentation/routes/dashboard';

// Initialize Winston logger
const logger = createLogger(config.logging.jsonFormat);

// Track request timings
const requestTimings = new Map<string, number>();

// Build app instance (exported for type inference)
const buildApp = () => new Elysia()
    .use(cors({
        origin: config.cors.origins,
        methods: config.cors.methods,
        allowedHeaders: config.cors.headers,
    }))
    .use(
        swagger({
            documentation: {
                info: {
                    title: 'Laboratory Inventory API',
                    version: '1.0.0',
                },
            },
        })
    )
    // Tracing Middleware
    .onBeforeHandle(({ request, path }) => {
        if (!config.logging.requests) return;

        const traceId = generateTraceId();
        const startTime = Date.now();
        requestTimings.set(traceId, startTime);

        return traceContext.run(traceId, () => {
            logger.info({
                message: 'request_start',
                method: request.method,
                path,
            });
        });
    })
    .onAfterHandle(({ request, path, set }) => {
        if (!config.logging.requests) return;

        const traceId = getTraceId();
        const startTime = traceId ? requestTimings.get(traceId) : undefined;
        const duration = startTime ? Date.now() - startTime : undefined;

        if (traceId) {
            requestTimings.delete(traceId);
        }

        const status = typeof set.status === 'number' ? set.status : 200;
        logger.info({
            message: 'request_end',
            method: request.method,
            path,
            status,
            duration,
        });
    })
    .onError(({ request, path, error, set }) => {
        const traceId = getTraceId();
        const startTime = traceId ? requestTimings.get(traceId) : undefined;
        const duration = startTime ? Date.now() - startTime : undefined;

        if (traceId) {
            requestTimings.delete(traceId);
        }

        const status = typeof set.status === 'number' ? set.status : 500;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        logger.error({
            message: 'request_error',
            method: request.method,
            path,
            status,
            error: errorMessage,
            stack: errorStack,
            duration,
        });
    })
    .get('/health', () => ({ status: 'ok' }))
    .use(authRoutes)
    .use(productRoutes)
    .use(transactionRoutes)
    .use(userRoutes)
    .use(roomRoutes)
    .use(inventoryRoutes)
    .use(notificationRoutes)
    .use(reportRoutes)
    .use(orderRoutes)
    .use(dashboardRoutes);

// Export type for client
export type App = ReturnType<typeof buildApp>;

const startServer = async () => {
    // Wait for database to be ready before starting
    logger.info('Waiting for database connection...');
    try {
        await waitForDatabase();
    } catch (error) {
        logger.error({
            message: 'Failed to connect to database',
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }

    const app = buildApp().listen({
        port: config.server.port,
        hostname: config.server.host,
    });

    logger.info(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);
    logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📝 Log level: ${config.logging.level}`);
    logger.info(`📋 JSON format: ${config.logging.jsonFormat}`);
};

startServer();
