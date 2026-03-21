import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { transactionRoutes } from './routes/transactions';
import { userRoutes } from './routes/users';
import { roomRoutes } from './routes/rooms';
import { inventoryRoutes } from './routes/inventory';
import { notificationRoutes } from './routes/notifications';
import { reportRoutes } from './routes/reports';

const getColor = (status: number) => {
    if (status >= 500) return '\x1b[31m'; // red
    if (status >= 400) return '\x1b[33m'; // yellow
    if (status >= 300) return '\x1b[36m'; // cyan
    return '\x1b[32m'; // green
};

const reset = '\x1b[0m';
const gray = '\x1b[90m';
const bright = '\x1b[1m';

const app = new Elysia()
    .use(cors())
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
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase().padEnd(7);
        console.log(`${gray}${timestamp}${reset} ${bright}${method}${reset} ${path}`);
    })
    .onAfterHandle(({ request, path, set }) => {
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase().padEnd(7);
        const status = set.status || 200;
        const color = getColor(status);
        console.log(`${gray}${timestamp}${reset} ${bright}${method}${reset} ${path} ${color}${status}${reset}`);
    })
    .onError(({ request, path, error, set }) => {
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase().padEnd(7);
        const status = set.status || 500;
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
    .listen(3001);

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
