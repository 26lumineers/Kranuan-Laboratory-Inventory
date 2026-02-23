import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { productRoutes } from './routes/products';
import { transactionRoutes } from './routes/transactions';
import { userRoutes } from './routes/users';
import { inventoryRoutes } from './routes/inventory';

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
    .get('/health', () => ({ status: 'ok' }))
    .use(productRoutes)
    .use(transactionRoutes)
    .use(userRoutes)
    .use(inventoryRoutes)
    .listen(3001);

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
