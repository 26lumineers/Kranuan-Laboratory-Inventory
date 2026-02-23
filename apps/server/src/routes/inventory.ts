import { Elysia, t } from 'elysia';
import { db, inventoryStocks, products, notifications } from '@laboratory/db';
import { eq, and, lt } from 'drizzle-orm';

export const inventoryRoutes = new Elysia({ prefix: '/inventory' })
    .get('/', async () => {
        const result = await db
            .select({
                productId: inventoryStocks.productId,
                quantity: inventoryStocks.quantity,
                updatedAt: inventoryStocks.updatedAt,
                product: products,
            })
            .from(inventoryStocks)
            .leftJoin(products, eq(inventoryStocks.productId, products.id));
        return result;
    })
    .get('/low-stock', async () => {
        const result = await db
            .select({
                productId: inventoryStocks.productId,
                quantity: inventoryStocks.quantity,
                product: products,
            })
            .from(inventoryStocks)
            .leftJoin(products, eq(inventoryStocks.productId, products.id))
            .where(lt(inventoryStocks.quantity, products.lowStockThreshold));
        return result;
    })
    .post(
        '/restock',
        async ({ body }) => {
            const { productId, quantity, userId } = body;

            return await db.transaction(async (tx) => {
                const [existing] = await tx.select().from(inventoryStocks).where(eq(inventoryStocks.productId, productId));

                let result;
                if (existing) {
                    [result] = await tx
                        .update(inventoryStocks)
                        .set({
                            quantity: existing.quantity + quantity,
                            updatedAt: new Date(),
                        })
                        .where(eq(inventoryStocks.productId, productId))
                        .returning();
                } else {
                    [result] = await tx.insert(inventoryStocks).values({ productId, quantity }).returning();
                }

                await tx.insert(inventoryMovements).values({
                    productId,
                    quantity,
                    movementType: 'IN',
                    createdBy: userId,
                });

                return result;
            });
        },
        {
            body: t.Object({
                productId: t.String(),
                quantity: t.Number(),
                userId: t.String(),
            }),
        }
    )
    .post(
        '/adjust',
        async ({ body }) => {
            const { productId, quantity, reason, userId } = body;

            return await db.transaction(async (tx) => {
                const [result] = await tx
                    .update(inventoryStocks)
                    .set({
                        quantity,
                        updatedAt: new Date(),
                    })
                    .where(eq(inventoryStocks.productId, productId))
                    .returning();

                await tx.insert(inventoryMovements).values({
                    productId,
                    quantity,
                    movementType: 'ADJUST',
                    createdBy: userId,
                });

                const [product] = await tx.select().from(products).where(eq(products.id, productId));

                if (quantity <= product.lowStockThreshold) {
                    await tx.insert(notifications).values({
                        title: 'Low Stock Alert',
                        message: `Product ${product.name} is running low (${quantity} remaining)`,
                    });
                }

                return result;
            });
        },
        {
            body: t.Object({
                productId: t.String(),
                quantity: t.Number(),
                reason: t.String(),
                userId: t.String(),
            }),
        }
    );
