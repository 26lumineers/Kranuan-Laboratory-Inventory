import { Elysia, t } from 'elysia';
import { db, inventoryTransactions, inventoryTransactionItems, users, rooms, products, inventoryMovements } from '@laboratory/db';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import { authenticateUser, type UserRole } from '../middleware/auth';

// Helper to check report access
const canViewReports = (role: UserRole): boolean => {
    return role === 'ADMIN' || role === 'SUPERADMIN';
};

export const reportRoutes = new Elysia({ prefix: '/reports' })
    // Daily report - ADMIN and SUPERADMIN only
    .get(
        '/daily',
        async ({ query, headers, set }) => {
            const user = await authenticateUser(headers);
            if (!canViewReports(user.role as UserRole)) {
                set.status = 403;
                return { error: 'You do not have permission to view reports' };
            }
            const date = query.date ? new Date(query.date) : new Date();
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const transactions = await db
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
                .leftJoin(users, eq(inventoryTransactions.userId, users.id))
                .leftJoin(rooms, eq(inventoryTransactions.roomId, rooms.id))
                .where(
                    and(
                        gte(inventoryTransactions.createdAt, startOfDay),
                        lte(inventoryTransactions.createdAt, endOfDay)
                    )
                )
                .orderBy(desc(inventoryTransactions.createdAt));

            const transactionsWithItems = await Promise.all(
                transactions.map(async (tx) => {
                    const items = await db
                        .select({
                            id: inventoryTransactionItems.id,
                            quantity: inventoryTransactionItems.quantity,
                            product: products,
                        })
                        .from(inventoryTransactionItems)
                        .leftJoin(products, eq(inventoryTransactionItems.productId, products.id))
                        .where(eq(inventoryTransactionItems.transactionId, tx.id));

                    return { ...tx, items };
                })
            );

            return {
                date: startOfDay.toISOString().split('T')[0],
                totalTransactions: transactionsWithItems.length,
                transactions: transactionsWithItems,
            };
        },
        {
            query: t.Object({
                date: t.Optional(t.String()),
            }),
        }
    )
    // Weekly report - ADMIN and SUPERADMIN only
    .get(
        '/weekly',
        async ({ query, headers, set }) => {
            const user = await authenticateUser(headers);
            if (!canViewReports(user.role as UserRole)) {
                set.status = 403;
                return { error: 'You do not have permission to view reports' };
            }
            const startDate = query.startDate ? new Date(query.startDate) : new Date();
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            const transactions = await db
                .select({
                    id: inventoryTransactions.id,
                    note: inventoryTransactions.note,
                    createdAt: inventoryTransactions.createdAt,
                    user: {
                        id: users.id,
                        fullName: users.fullName,
                    },
                    room: {
                        id: rooms.id,
                        name: rooms.name,
                    },
                })
                .from(inventoryTransactions)
                .leftJoin(users, eq(inventoryTransactions.userId, users.id))
                .leftJoin(rooms, eq(inventoryTransactions.roomId, rooms.id))
                .where(
                    and(
                        gte(inventoryTransactions.createdAt, startDate),
                        lte(inventoryTransactions.createdAt, endDate)
                    )
                )
                .orderBy(desc(inventoryTransactions.createdAt));

            const groupedByDay = transactions.reduce((acc, tx) => {
                const day = tx.createdAt!.toISOString().split('T')[0];
                if (!acc[day]) acc[day] = [];
                acc[day].push(tx);
                return acc;
            }, {} as Record<string, typeof transactions>);

            return {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                totalTransactions: transactions.length,
                dailyBreakdown: groupedByDay,
            };
        },
        {
            query: t.Object({
                startDate: t.Optional(t.String()),
            }),
        }
    )
    // Monthly report - ADMIN and SUPERADMIN only
    .get(
        '/monthly',
        async ({ query, headers, set }) => {
            const user = await authenticateUser(headers);
            if (!canViewReports(user.role as UserRole)) {
                set.status = 403;
                return { error: 'You do not have permission to view reports' };
            }
            const year = query.year ? parseInt(query.year) : new Date().getFullYear();
            const month = query.month ? parseInt(query.month) - 1 : new Date().getMonth();

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const transactions = await db
                .select({
                    id: inventoryTransactions.id,
                    note: inventoryTransactions.note,
                    createdAt: inventoryTransactions.createdAt,
                    user: {
                        id: users.id,
                        fullName: users.fullName,
                    },
                    room: {
                        id: rooms.id,
                        name: rooms.name,
                    },
                })
                .from(inventoryTransactions)
                .leftJoin(users, eq(inventoryTransactions.userId, users.id))
                .leftJoin(rooms, eq(inventoryTransactions.roomId, rooms.id))
                .where(
                    and(
                        gte(inventoryTransactions.createdAt, startDate),
                        lte(inventoryTransactions.createdAt, endDate)
                    )
                )
                .orderBy(desc(inventoryTransactions.createdAt));

            const groupedByDay = transactions.reduce((acc, tx) => {
                const day = tx.createdAt!.toISOString().split('T')[0];
                if (!acc[day]) acc[day] = [];
                acc[day].push(tx);
                return acc;
            }, {} as Record<string, typeof transactions>);

            return {
                year,
                month: month + 1,
                totalTransactions: transactions.length,
                dailyBreakdown: groupedByDay,
            };
        },
        {
            query: t.Object({
                year: t.Optional(t.String()),
                month: t.Optional(t.String()),
            }),
        }
    )
    // By room report - ADMIN and SUPERADMIN only
    .get(
        '/by-room',
        async ({ query, headers, set }) => {
            const user = await authenticateUser(headers);
            if (!canViewReports(user.role as UserRole)) {
                set.status = 403;
                return { error: 'You do not have permission to view reports' };
            }
            const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = query.endDate ? new Date(query.endDate) : new Date();

            const transactions = await db
                .select({
                    id: inventoryTransactions.id,
                    createdAt: inventoryTransactions.createdAt,
                    room: {
                        id: rooms.id,
                        name: rooms.name,
                    },
                })
                .from(inventoryTransactions)
                .leftJoin(rooms, eq(inventoryTransactions.roomId, rooms.id))
                .where(
                    and(
                        gte(inventoryTransactions.createdAt, startDate),
                        lte(inventoryTransactions.createdAt, endDate)
                    )
                );

            const groupedByRoom = transactions.reduce((acc, tx) => {
                const roomName = tx.room?.name || 'Unknown';
                if (!acc[roomName]) acc[roomName] = { count: 0, roomId: tx.room?.id ?? null };
                acc[roomName].count++;
                return acc;
            }, {} as Record<string, { count: number; roomId: string | null }>);

            return {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                byRoom: groupedByRoom,
            };
        },
        {
            query: t.Object({
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
            }),
        }
    )
    // By user report - ADMIN and SUPERADMIN only
    .get(
        '/by-user',
        async ({ query, headers, set }) => {
            const user = await authenticateUser(headers);
            if (!canViewReports(user.role as UserRole)) {
                set.status = 403;
                return { error: 'You do not have permission to view reports' };
            }
            const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = query.endDate ? new Date(query.endDate) : new Date();

            const transactions = await db
                .select({
                    id: inventoryTransactions.id,
                    createdAt: inventoryTransactions.createdAt,
                    user: {
                        id: users.id,
                        fullName: users.fullName,
                        nickname: users.nickname,
                    },
                })
                .from(inventoryTransactions)
                .leftJoin(users, eq(inventoryTransactions.userId, users.id))
                .where(
                    and(
                        gte(inventoryTransactions.createdAt, startDate),
                        lte(inventoryTransactions.createdAt, endDate)
                    )
                );

            const groupedByUser = transactions.reduce((acc, tx) => {
                const userName = tx.user?.fullName || 'Unknown';
                if (!acc[userName]) acc[userName] = { count: 0, userId: tx.user?.id ?? null };
                acc[userName].count++;
                return acc;
            }, {} as Record<string, { count: number; userId: string | null }>);

            return {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                byUser: groupedByUser,
            };
        },
        {
            query: t.Object({
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
            }),
        }
    )
    // Inventory movements - ADMIN and SUPERADMIN only
    .get('/inventory-movements', async ({ query, headers, set }) => {
        const user = await authenticateUser(headers);
        if (!canViewReports(user.role as UserRole)) {
            set.status = 403;
            return { error: 'You do not have permission to view reports' };
        }
        const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = query.endDate ? new Date(query.endDate) : new Date();
        endDate.setHours(23, 59, 59, 999);

        const movements = await db
            .select({
                id: inventoryMovements.id,
                quantity: inventoryMovements.quantity,
                movementType: inventoryMovements.movementType,
                createdAt: inventoryMovements.createdAt,
                product: products,
            })
            .from(inventoryMovements)
            .leftJoin(products, eq(inventoryMovements.productId, products.id))
            .where(
                and(
                    gte(inventoryMovements.createdAt, startDate),
                    lte(inventoryMovements.createdAt, endDate)
                )
            )
            .orderBy(desc(inventoryMovements.createdAt));

        const summary = {
            totalIn: movements.filter(m => m.movementType === 'IN').reduce((sum, m) => sum + m.quantity, 0),
            totalOut: movements.filter(m => m.movementType === 'OUT').reduce((sum, m) => sum + m.quantity, 0),
            totalAdjust: movements.filter(m => m.movementType === 'ADJUST').length,
        };

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            summary,
            movements,
        };
    });
