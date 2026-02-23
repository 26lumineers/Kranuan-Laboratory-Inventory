import { Elysia, t } from 'elysia';
import { db, products, type NewProduct } from '@laboratory/db';

export const productRoutes = new Elysia({ prefix: '/products' })
    .get('/', async () => {
        const result = await db.select().from(products);
        return result;
    })
    .get('/:id', async ({ params }) => {
        const result = await db
            .select()
            .from(products)
            .where(({ id }) => id.eq(params.id));
        return result[0];
    })
    .post(
        '/',
        async ({ body }) => {
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
                description: t.Optional(t.String()),
                lowStockThreshold: t.Optional(t.Number()),
            }),
        }
    )
    .put(
        '/:id',
        async ({ params, body }) => {
            const result = await db
                .update(products)
                .set(body)
                .where(({ id }) => id.eq(params.id))
                .returning();
            return result[0];
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                unit: t.Optional(t.String()),
                description: t.Optional(t.String()),
                lowStockThreshold: t.Optional(t.Number()),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    )
    .delete('/:id', async ({ params }) => {
        const result = await db
            .update(products)
            .set({ isActive: false })
            .where(({ id }) => id.eq(params.id))
            .returning();
        return result[0];
    });
