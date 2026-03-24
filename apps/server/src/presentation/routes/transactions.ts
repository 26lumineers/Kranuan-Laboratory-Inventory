import { Elysia, t } from 'elysia';
import { db, inventoryTransactions, inventoryTransactionItems, inventoryStocks, inventoryMovements, users, rooms, products } from '@laboratory/db';
import { eq, desc, count } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

export const transactionRoutes = new Elysia({ prefix: '/transactions' })
    // List transactions - All authenticated users (GENERAL can see their own, ADMIN/SUPERADMIN see all)
    .get(
        '/',
        async ({ headers, query }) => {
            const user = await authenticateUser(headers);
            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 20;
            const offset = (page - 1) * limit;

            const baseQuery = db
                .select({
                    id: inventoryTransactions.id,
                    note: inventoryTransactions.note,
                    createdAt: inventoryTransactions.createdAt,
                    user: {
                        id: users.id,
                        fullName: users.fullName,
                        nickname: users.nickname,
                    },
                    room: {
                        id: rooms.id,
                        name: rooms.name,
                    },
                })
                .from(inventoryTransactions)
                .innerJoin(users, eq(inventoryTransactions.userId, users.id))
                .innerJoin(rooms, eq(inventoryTransactions.roomId, rooms.id))
                .orderBy(desc(inventoryTransactions.createdAt));

            const countQuery = db
                .select({ count: count() })
                .from(inventoryTransactions)
                .innerJoin(users, eq(inventoryTransactions.userId, users.id))
                .innerJoin(rooms, eq(inventoryTransactions.roomId, rooms.id));

            if (user.role === 'GENERAL') {
                // General users can only see their own transactions
                const [data, totalResult] = await Promise.all([
                    baseQuery.where(eq(inventoryTransactions.userId, user.id)).limit(limit).offset(offset),
                    countQuery.where(eq(inventoryTransactions.userId, user.id)),
                ]);
                return {
                    data,
                    pagination: {
                        page,
                        limit,
                        total: totalResult[0].count,
                        totalPages: Math.ceil(totalResult[0].count / limit),
                    },
                };
            }

            // ADMIN and SUPERADMIN can see all
            const [data, totalResult] = await Promise.all([
                baseQuery.limit(limit).offset(offset),
                countQuery,
            ]);
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total: totalResult[0].count,
                    totalPages: Math.ceil(totalResult[0].count / limit),
                },
            };
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
        }
    )
    .get('/:id', async ({ params, headers, status }) => {
        const user = await authenticateUser(headers);
        const [transaction] = await db
            .select({
                id: inventoryTransactions.id,
                note: inventoryTransactions.note,
                createdAt: inventoryTransactions.createdAt,
                userId: inventoryTransactions.userId,
                user: {
                    id: users.id,
                    fullName: users.fullName,
                    nickname: users.nickname,
                },
                room: {
                    id: rooms.id,
                    name: rooms.name,
                },
            })
            .from(inventoryTransactions)
            .innerJoin(users, eq(inventoryTransactions.userId, users.id))
            .innerJoin(rooms, eq(inventoryTransactions.roomId, rooms.id))
            .where(eq(inventoryTransactions.id, params.id));

        if (!transaction) {
            return status(404, { error: 'Transaction not found' });
        }

        // GENERAL users can only view their own transactions
        if (user.role === 'GENERAL' && transaction.userId !== user.id) {
            return status(403, { error: 'You can only view your own transactions' });
        }

        const items = await db
            .select({
                id: inventoryTransactionItems.id,
                quantity: inventoryTransactionItems.quantity,
                product: {
                    id: products.id,
                    name: products.name,
                    unit: products.unit,
                },
            })
            .from(inventoryTransactionItems)
            .innerJoin(products, eq(inventoryTransactionItems.productId, products.id))
            .where(eq(inventoryTransactionItems.transactionId, params.id));

        return { ...transaction, items };
    })
    // Create transaction - All authenticated users can order (GENERAL, ADMIN, SUPERADMIN)
    .post(
        '/',
        async ({ body, headers }) => {
            const user = await authenticateUser(headers);
            const { roomId, note, items } = body;

            // Use the authenticated user's ID
            const userId = user.id;

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
                roomId: t.String(),
                note: t.Optional(t.String()),
                items: t.Array(
                    t.Object({
                        productId: t.String(),
                        quantity: t.Number({ minimum: 1 }),
                    })
                ),
            }),
        }
    );
