import { Elysia, t } from 'elysia';
import { authenticateUser } from '../middleware/auth';
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    approveInvoice,
    rejectInvoice,
} from '../../application/services/invoice.service';

export const invoiceRoutes = new Elysia({ prefix: '/invoices' })
    // List invoices - ADMIN and SUPERADMIN only
    .get('/', async ({ headers, query, status }) => {
        const user = await authenticateUser(headers);

        // GENERAL users cannot access invoices
        if (user.role === 'GENERAL') {
            return status(403, { error: 'GENERAL users cannot access invoices' });
        }

        // ADMIN and SUPERADMIN can filter by status
        return getInvoices({
            status: query.status as any,
        });
    }, {
        query: t.Object({
            status: t.Optional(t.Union([
                t.Literal('PENDING'),
                t.Literal('APPROVED'),
                t.Literal('REJECTED'),
                t.Literal('SUCCESS'),
            ])),
        }),
    })
    // Get invoice by ID - ADMIN and SUPERADMIN only
    .get('/:id', async ({ params, headers, status }) => {
        const user = await authenticateUser(headers);

        // GENERAL users cannot access invoices
        if (user.role === 'GENERAL') {
            return status(403, { error: 'GENERAL users cannot access invoices' });
        }

        const invoice = await getInvoiceById(params.id);

        if (!invoice) {
            return status(404, { error: 'Invoice not found' });
        }

        return invoice;
    })
    // Create invoice - ADMIN and SUPERADMIN only
    .post(
        '/',
        async ({ body, headers, status }) => {
            const user = await authenticateUser(headers);

            // GENERAL users cannot create invoices
            if (user.role === 'GENERAL') {
                return status(403, { error: 'GENERAL users cannot create invoices' });
            }

            try {
                const invoice = await createInvoice({
                    description: body.description,
                    createdBy: user.id,
                    note: body.note,
                    items: body.items,
                });

                return status(201, invoice);
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to create invoice' });
            }
        },
        {
            body: t.Object({
                description: t.Optional(t.String()),
                note: t.Optional(t.String()),
                items: t.Array(
                    t.Object({
                        productId: t.String(),
                        quantity: t.Number({ minimum: 1 }),
                    }),
                    { minItems: 1 }
                ),
            }),
        }
    )
    // Update invoice - ADMIN and SUPERADMIN only, only if status is PENDING
    .put(
        '/:id',
        async ({ params, body, headers, status }) => {
            const user = await authenticateUser(headers);

            // GENERAL users cannot update invoices
            if (user.role === 'GENERAL') {
                return status(403, { error: 'GENERAL users cannot update invoices' });
            }

            const invoice = await getInvoiceById(params.id);

            if (!invoice) {
                return status(404, { error: 'Invoice not found' });
            }

            // Cannot edit invoices with SUCCESS status
            if (invoice.status === 'SUCCESS') {
                return status(400, { error: 'Cannot edit invoice with SUCCESS status' });
            }

            try {
                const updatedInvoice = await updateInvoice(params.id, {
                    description: body.description,
                    note: body.note,
                    status: body.status,
                    items: body.items,
                });

                return updatedInvoice;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to update invoice' });
            }
        },
        {
            body: t.Object({
                description: t.Optional(t.String()),
                note: t.Optional(t.String()),
                status: t.Optional(t.Union([
                    t.Literal('PENDING'),
                    t.Literal('APPROVED'),
                    t.Literal('REJECTED'),
                    t.Literal('SUCCESS'),
                ])),
                items: t.Optional(
                    t.Array(
                        t.Object({
                            productId: t.String(),
                            quantity: t.Number({ minimum: 1 }),
                        }),
                        { minItems: 1 }
                    )
                ),
            }),
        }
    )
    // Delete invoice - SUPERADMIN only
    .delete(
        '/:id',
        async ({ params, headers, status }) => {
            const user = await authenticateUser(headers);

            if (user.role !== 'SUPERADMIN') {
                return status(403, { error: 'Only SUPERADMIN can delete invoices' });
            }

            try {
                await deleteInvoice(params.id);
                return status(200, { message: 'Invoice deleted successfully' });
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to delete invoice' });
            }
        }
    )
    // Approve invoice - SUPERADMIN only (increases stock and sets status to SUCCESS)
    .post(
        '/:id/approve',
        async ({ params, headers, status }) => {
            const user = await authenticateUser(headers);

            if (user.role !== 'SUPERADMIN') {
                return status(403, { error: 'Only SUPERADMIN can approve invoices' });
            }

            try {
                const invoice = await approveInvoice(params.id, user.id);
                return invoice;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to approve invoice' });
            }
        }
    )
    // Reject invoice - SUPERADMIN only
    .post(
        '/:id/reject',
        async ({ params, headers, status }) => {
            const user = await authenticateUser(headers);

            if (user.role !== 'SUPERADMIN') {
                return status(403, { error: 'Only SUPERADMIN can reject invoices' });
            }

            try {
                const invoice = await rejectInvoice(params.id, user.id);
                return invoice;
            } catch (error) {
                return status(400, { error: error instanceof Error ? error.message : 'Failed to reject invoice' });
            }
        }
    );
