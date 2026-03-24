import { Elysia, t } from 'elysia';
import { authenticateUser } from '../middleware/auth';
import {
    createOrder,
    getOrders,
    getOrderById,
    approveOrder,
    rejectOrder,
    fulfillOrder,
    cancelOrder,
    getOrdersByUserId,
} from '../../application/services/order.service';

export const orderRoutes = new Elysia({ prefix: '/orders' })
    // List orders - All authenticated users (GENERAL sees own, ADMIN/SUPERADMIN sees all)
    .get('/', async ({ headers, query }) => {
        const user = await authenticateUser(headers);

        // GENERAL users can only see their own orders
        if (user.role === 'GENERAL') {
            return getOrdersByUserId(user.id);
        }

        // ADMIN and SUPERADMIN can filter by status, userId, roomId
        return getOrders({
            userId: query.userId,
            roomId: query.roomId,
            status: query.status as any,
        });
    }, {
        query: t.Object({
            userId: t.Optional(t.String()),
            roomId: t.Optional(t.String()),
            status: t.Optional(t.Union([
                t.Literal('PENDING'),
                t.Literal('APPROVED'),
                t.Literal('REJECTED'),
                t.Literal('FULFILLED'),
                t.Literal('CANCELLED'),
            ])),
        }),
    })
    // Get order by ID
    .get('/:id', async ({ params, headers, status }) => {
        const user = await authenticateUser(headers);
        const order = await getOrderById(params.id);

        if (!order) {
            return status(404, { error: 'Order not found' });
        }

        // GENERAL users can only view their own orders
        if (user.role === 'GENERAL' && order.userId !== user.id) {
            return status(403, { error: 'You can only view your own orders' });
        }

        return order;
    })
    // Create order - All authenticated users
    .post(
        '/',
        async ({ body, headers, status }) => {
            const user = await authenticateUser(headers);

            // Users can only create orders for themselves
            const order = await createOrder({
                userId: user.id,
                roomId: body.roomId,
                note: body.note,
                items: body.items,
            });

            return status(201, order);
        },
        {
            body: t.Object({
                roomId: t.String(),
                note: t.Optional(t.String()),
                items: t.Array(
                    t.Object({
                        productId: t.String(),
                        quantity: t.Number({ minimum: 1 }),
                        note: t.Optional(t.String()),
                    }),
                    { minItems: 1 }
                ),
            }),
        }
    )
    // Approve order - ADMIN and SUPERADMIN only
    .post(
        '/:id/approve',
        async ({ params, body, headers, status }) => {
            const user = await authenticateUser(headers);

            if (user.role === 'GENERAL') {
                return status(403, { error: 'Only ADMIN or SUPERADMIN can approve orders' });
            }

            try {
                const order = await approveOrder(params.id, user.id, body?.adminNote);
                return order;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to approve order' });
            }
        },
        {
            body: t.Object({
                adminNote: t.Optional(t.String()),
            }),
        }
    )
    // Reject order - ADMIN and SUPERADMIN only
    .post(
        '/:id/reject',
        async ({ params, body, headers, status }) => {
            const user = await authenticateUser(headers);

            if (user.role === 'GENERAL') {
                return status(403, { error: 'Only ADMIN or SUPERADMIN can reject orders' });
            }

            try {
                const order = await rejectOrder(params.id, user.id, body?.adminNote);
                return order;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to reject order' });
            }
        },
        {
            body: t.Object({
                adminNote: t.Optional(t.String()),
            }),
        }
    )
    // Fulfill order - SUPERADMIN only (deducts inventory)
    .post(
        '/:id/fulfill',
        async ({ params, body, headers, status }) => {
            const user = await authenticateUser(headers);

            if (user.role !== 'SUPERADMIN') {
                return status(403, { error: 'Only SUPERADMIN can fulfill orders' });
            }

            try {
                const order = await fulfillOrder(params.id, user.id, body?.items);
                return order;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to fulfill order' });
            }
        },
        {
            body: t.Object({
                items: t.Optional(
                    t.Array(
                        t.Object({
                            itemId: t.String(),
                            fulfilledQuantity: t.Number({ minimum: 0 }),
                        })
                    )
                ),
            }),
        }
    )
    // Cancel order - User can cancel own pending orders, SUPERADMIN can cancel any
    .post(
        '/:id/cancel',
        async ({ params, headers, status }) => {
            const user = await authenticateUser(headers);
            const order = await getOrderById(params.id);

            if (!order) {
                return status(404, { error: 'Order not found' });
            }

            // Users can only cancel their own pending orders
            if (user.role === 'GENERAL') {
                if (order.userId !== user.id) {
                    return status(403, { error: 'You can only cancel your own orders' });
                }
                if (order.status !== 'PENDING') {
                    return status(400, { error: 'Can only cancel pending orders' });
                }
            }

            // ADMIN can only cancel pending/approved orders
            if (user.role === 'ADMIN' && order.status !== 'PENDING' && order.status !== 'APPROVED') {
                return status(400, { error: 'Can only cancel pending or approved orders' });
            }

            try {
                const cancelledOrder = await cancelOrder(params.id, user.id);
                return cancelledOrder;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to cancel order' });
            }
        }
    );
