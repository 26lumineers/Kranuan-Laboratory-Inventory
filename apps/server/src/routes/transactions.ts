import { Elysia, t } from 'elysia';
import { db, inventoryTransactions, inventoryTransactionItems, inventoryStocks, inventoryMovements, products } from '@laboratory/db';
import { eq, and } from 'drizzle-orm';

export const transactionRoutes = new Elysia({ prefix: '/transactions' })
    .get('/', async () => {
        const result = await db.select().from(inventoryTransactions);
        return result;
    })
    .get('/:id', async ({ params }) => {
        const transaction = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, params.id));
        const items = await db.select().from(inventoryTransactionItems).where(eq(inventoryTransactionItems.transactionId, params.id));
        return { ...transaction[0], items };
    })
    .post(
        '/',
        async ({ body }) => {
            const { userId, roomId, note, items } = body;

            return await db.transaction(async (tx) => {
                const [transaction] = await tx.insert(inventoryTransactions).values({ userId, roomId, note }).returning();

                for (const item of items) {
                    await tx.insert(inventoryTransactionItems).values({
                        transactionId: transaction.id,
                        productId: item.productId,
                        quantity: item.quantity,
                    });

                    const [stock] = await tx.select().from(inventoryStocks).where(eq(inventoryStocks.productId, item.productId)).for('update');

                    if (!stock || stock.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for product ${item.productId}`);
                    }

                    await tx
                        .update(inventoryStocks)
                        .set({
                            quantity: stock.quantity - item.quantity,
                            updatedAt: new Date(),
                        })
                        .where(eq(inventoryStocks.productId, item.productId));

                    await tx.insert(inventoryMovements).values({
                        productId: item.productId,
                        quantity: item.quantity,
                        movementType: 'OUT',
                        referenceTransaction: transaction.id,
                        createdBy: userId,
                    });
                }

                return transaction;
            });
        },
        {
            body: t.Object({
                userId: t.String(),
                roomId: t.String(),
                note: t.Optional(t.String()),
                items: t.Array(
                    t.Object({
                        productId: t.String(),
                        quantity: t.Number(),
                    })
                ),
            }),
        }
    );
