import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
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

const getColor = (status: number) => {
    if (status >= 500) return '\x1b[31m'; // red
    if (status >= 400) return '\x1b[33m'; // yellow
    if (status >= 300) return '\x1b[36m'; // cyan
    return '\x1b[32m'; // green
};

const reset = '\x1b[0m';
const gray = '\x1b[90m';
const bright = '\x1b[1m';

const shouldLogRequests = config.logging.requests && !config.logging.jsonFormat;

const app = new Elysia()
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
    // Request Logger Middleware
    .onBeforeHandle(({ request, path }) => {
        if (!shouldLogRequests) return;
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase().padEnd(7);
        console.log(`${gray}${timestamp}${reset} ${bright}${method}${reset} ${path}`);
    })
    .onAfterHandle(({ request, path, set }) => {
        if (!shouldLogRequests) return;
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase().padEnd(7);
        const status = typeof set.status === 'number' ? set.status : 200;
        const color = getColor(status);
        console.log(`${gray}${timestamp}${reset} ${bright}${method}${reset} ${path} ${color}${status}${reset}`);
    })
    .onError(({ request, path, error, set }) => {
        if (!shouldLogRequests) return;
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase().padEnd(7);
        const status = typeof set.status === 'number' ? set.status : 500;
        const color = getColor(status);
        console.error(`${gray}${timestamp}${reset} ${bright}${method}${reset} ${path} ${color}${status}${reset} - ${error}`);
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
    .listen({
        port: config.server.port,
        hostname: config.server.host,
    });

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📝 Log level: ${config.logging.level}`);

export type App = typeof app;
