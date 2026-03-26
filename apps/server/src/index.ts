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
import { invoiceRoutes } from './presentation/routes/invoices';

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
    // Early request handling - runs before any other lifecycle
    // Use for: rate limiting, IP filtering, request ID generation
    .onRequest(({ request, set }) => {
        // Generate trace ID early in the request lifecycle
        const traceId = generateTraceId();
        const startTime = Date.now();
        requestTimings.set(traceId, startTime);

        // Store trace ID in headers for correlation
        set.headers['X-Trace-Id'] = traceId;

        return traceContext.run(traceId, () => {
            if (config.logging.requests) {
                logger.info({
                    message: 'request_received',
                    method: request.method,
                    url: request.url,
                });
            }
        });
    })
    // Tracing Middleware - runs after validation but before route handler
    .onBeforeHandle(({ request, path }) => {
        if (!config.logging.requests) return;

        const traceId = getTraceId();
        if (!traceId) return;

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

        const statusCode = typeof set.status === 'number' ? set.status : 200;
        logger.info({
            message: 'request_end',
            method: request.method,
            path,
            status: statusCode,
            duration,
        });
    })
    // Cleanup and analytics - runs after response is sent (non-blocking)
    .onAfterResponse(({ request, path, set }) => {
        const traceId = getTraceId();
        if (traceId) {
            requestTimings.delete(traceId);
        }

        // Future: Record metrics, analytics, audit logs
        if (config.logging.requests) {
            logger.info({
                message: 'response_sent',
                method: request.method,
                path,
                status: typeof set.status === 'number' ? set.status : 200,
            });
        }
    })
    // Global error handling with Elysia error codes
    .onError(({ code, error, request, path, status }) => {
        const traceId = getTraceId();
        const startTime = traceId ? requestTimings.get(traceId) : undefined;
        const duration = startTime ? Date.now() - startTime : undefined;

        if (traceId) {
            requestTimings.delete(traceId);
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Handle different error codes
        switch (code) {
            case 'NOT_FOUND':
                logger.warn({
                    message: 'route_not_found',
                    method: request.method,
                    path,
                    duration,
                });
                return status(404, { error: 'Resource not found', path });

            case 'VALIDATION':
                logger.warn({
                    message: 'validation_error',
                    method: request.method,
                    path,
                    error: errorMessage,
                    duration,
                });
                return status(400, { error: 'Validation failed', details: errorMessage });

            case 'PARSE':
                logger.warn({
                    message: 'parse_error',
                    method: request.method,
                    path,
                    error: errorMessage,
                    duration,
                });
                return status(400, { error: 'Invalid request body', details: errorMessage });

            case 'INVALID_COOKIE_SIGNATURE':
                logger.warn({
                    message: 'invalid_cookie',
                    method: request.method,
                    path,
                    duration,
                });
                return status(400, { error: 'Invalid cookie signature' });

            case 'INVALID_FILE_TYPE':
                logger.warn({
                    message: 'invalid_file_type',
                    method: request.method,
                    path,
                    error: errorMessage,
                    duration,
                });
                return status(400, { error: 'Invalid file type', details: errorMessage });

            default:
                logger.error({
                    message: 'internal_error',
                    method: request.method,
                    path,
                    error: errorMessage,
                    stack: errorStack,
                    duration,
                });
                return status(500, { error: 'Internal server error' });
        }
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
    .use(dashboardRoutes)
    .use(invoiceRoutes);

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
