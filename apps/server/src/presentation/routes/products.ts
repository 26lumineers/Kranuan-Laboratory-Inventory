import { Elysia, t } from 'elysia';
import { db, products, inventoryStocks, type NewProduct } from '@laboratory/db';
import { eq, gt } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

export const productRoutes = new Elysia({ prefix: '/products' })
    // List products - All authenticated users (they need to see products to order)
    .get('/', async ({ headers }) => {
        await authenticateUser(headers);
        const result = await db.select().from(products);
        return result;
    })
    // Get available products for ordering (with stock > 0, but NO stock quantity shown)
    .get('/available', async ({ headers }) => {
        const user = await authenticateUser(headers);
        const result = await db
            .select({
                id: products.id,
                name: products.name,
                unit: products.unit,
                category: products.category,
                description: products.description,
            })
            .from(products)
            .innerJoin(inventoryStocks, eq(products.id, inventoryStocks.productId))
            .where(gt(inventoryStocks.quantity, 0));
        console.log(`[Products Available] User: ${user.username} (${user.role}) - Found ${result.length} products`);
        return result;
    })
    .get('/:id', async ({ params, headers }) => {
        await authenticateUser(headers);
        const result = await db
            .select()
            .from(products)
            .where(eq(products.id, params.id));
        return result[0];
    })
    // Create product - SUPERADMIN only
    .post(
        '/',
        async ({ body, headers, status }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                return status(403, { error: 'Only SUPERADMIN can create products' });
            }
            const result = await db
                .insert(products)
                .values(body as NewProduct)
                .returning();
            return result[0];
        },
        {
            body: t.Object({
                name: t.String(),
                unit: t.String(),
                category: t.Optional(t.String()),
                description: t.Optional(t.String()),
                lowStockThreshold: t.Optional(t.Number()),
            }),
        }
    )
    // Update product - SUPERADMIN only
    .put(
        '/:id',
        async ({ params, body, headers, status }) => {
            const user = await authenticateUser(headers);
            if (user.role !== 'SUPERADMIN') {
                return status(403, { error: 'Only SUPERADMIN can update products' });
            }
            const result = await db
                .update(products)
                .set(body)
                .where(eq(products.id, params.id))
                .returning();
            return result[0];
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                unit: t.Optional(t.String()),
                category: t.Optional(t.String()),
                description: t.Optional(t.String()),
                lowStockThreshold: t.Optional(t.Number()),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    )
    // Delete product (soft delete) - SUPERADMIN only
    .delete('/:id', async ({ params, headers, status }) => {
        const user = await authenticateUser(headers);
        if (user.role !== 'SUPERADMIN') {
            return status(403, { error: 'Only SUPERADMIN can delete products' });
        }
        const result = await db
            .update(products)
            .set({ isActive: false })
            .where(eq(products.id, params.id))
            .returning();
        return result[0];
    });
