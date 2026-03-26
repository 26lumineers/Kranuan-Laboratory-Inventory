import { db, invoices, invoiceItems, products, users, inventoryStocks, inventoryMovements } from '@laboratory/db';
import { eq, and, inArray, sql } from 'drizzle-orm';

export type InvoiceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUCCESS';

export interface CreateInvoicePayload {
    description?: string;
    createdBy: string;
    note?: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
}

export interface UpdateInvoicePayload {
    description?: string;
    note?: string;
    status?: InvoiceStatus;
    items?: Array<{
        productId: string;
        quantity: number;
    }>;
}

export interface InvoiceWithItems {
    id: string;
    invoiceNumber: string;
    description: string | null;
    status: InvoiceStatus;
    createdBy: string;
    note: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    items: Array<{
        id: string;
        productId: string;
        productName: string | null;
        productUnit: string | null;
        quantity: number;
    }>;
    creator?: {
        id: string;
        fullName: string;
        username: string;
    } | null;
}

/**
 * Generate a unique invoice number with running sequence
 */
async function generateInvoiceNumber(): Promise<string> {
    // Get the count of existing invoices to generate running number
    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices);

    const count = result?.count || 0;
    const runningNumber = String(count + 1).padStart(6, '0');
    return `INV-${runningNumber}`;
}

/**
 * Create a new invoice
 */
export async function createInvoice(payload: CreateInvoicePayload): Promise<InvoiceWithItems> {
    const invoiceNumber = await generateInvoiceNumber();

    return await db.transaction(async (tx) => {
        // Create the invoice
        const [invoice] = await tx
            .insert(invoices)
            .values({
                invoiceNumber,
                description: payload.description,
                createdBy: payload.createdBy,
                note: payload.note,
                status: 'PENDING',
            })
            .returning();

        // Create invoice items
        const invoiceItemsData = payload.items.map((item) => ({
            invoiceId: invoice.id,
            productId: item.productId,
            quantity: item.quantity,
        }));

        const createdItems = await tx.insert(invoiceItems).values(invoiceItemsData).returning();

        // Fetch product details for response
        const productIds = payload.items.map((item) => item.productId);
        const productList = await tx
            .select({
                id: products.id,
                name: products.name,
                unit: products.unit,
            })
            .from(products)
            .where(inArray(products.id, productIds));

        const productMap = new Map(productList.map((p) => [p.id, p]));

        return {
            ...invoice,
            items: createdItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: productMap.get(item.productId)?.name || 'Unknown',
                productUnit: productMap.get(item.productId)?.unit || 'Unknown',
                quantity: item.quantity,
            })),
        };
    });
}

/**
 * Get all invoices (with filtering)
 */
export async function getInvoices(options?: {
    status?: InvoiceStatus;
    createdBy?: string;
}): Promise<InvoiceWithItems[]> {
    const conditions: any[] = [];

    if (options?.status) {
        conditions.push(eq(invoices.status, options.status));
    }
    if (options?.createdBy) {
        conditions.push(eq(invoices.createdBy, options.createdBy));
    }

    const invoiceList = await db
        .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            description: invoices.description,
            status: invoices.status,
            createdBy: invoices.createdBy,
            note: invoices.note,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            creator: {
                id: users.id,
                fullName: users.fullName,
                username: users.username,
            },
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.createdBy, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sql`${invoices.createdAt} DESC`);

    // Fetch items for each invoice
    const invoiceIds = invoiceList.map((inv) => inv.id);
    const allItems = await db
        .select({
            id: invoiceItems.id,
            invoiceId: invoiceItems.invoiceId,
            productId: invoiceItems.productId,
            productName: products.name,
            productUnit: products.unit,
            quantity: invoiceItems.quantity,
        })
        .from(invoiceItems)
        .leftJoin(products, eq(invoiceItems.productId, products.id))
        .where(inArray(invoiceItems.invoiceId, invoiceIds));

    const itemsByInvoice = new Map<string, typeof allItems>();
    for (const item of allItems) {
        if (!itemsByInvoice.has(item.invoiceId)) {
            itemsByInvoice.set(item.invoiceId, []);
        }
        itemsByInvoice.get(item.invoiceId)!.push(item);
    }

    return invoiceList.map((invoice) => ({
        ...invoice,
        items: itemsByInvoice.get(invoice.id) || [],
    }));
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithItems | null> {
    const [invoice] = await db
        .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            description: invoices.description,
            status: invoices.status,
            createdBy: invoices.createdBy,
            note: invoices.note,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            creator: {
                id: users.id,
                fullName: users.fullName,
                username: users.username,
            },
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.createdBy, users.id))
        .where(eq(invoices.id, invoiceId));

    if (!invoice) return null;

    const items = await db
        .select({
            id: invoiceItems.id,
            invoiceId: invoiceItems.invoiceId,
            productId: invoiceItems.productId,
            productName: products.name,
            productUnit: products.unit,
            quantity: invoiceItems.quantity,
        })
        .from(invoiceItems)
        .leftJoin(products, eq(invoiceItems.productId, products.id))
        .where(eq(invoiceItems.invoiceId, invoiceId));

    return {
        ...invoice,
        items,
    };
}

/**
 * Update an invoice (only if PENDING)
 */
export async function updateInvoice(
    invoiceId: string,
    payload: UpdateInvoicePayload
): Promise<InvoiceWithItems> {
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
        throw new Error('Invoice not found');
    }

    if (existingInvoice.status === 'SUCCESS') {
        throw new Error('Cannot update invoice with SUCCESS status');
    }

    return await db.transaction(async (tx) => {
        // Update invoice
        const [invoice] = await tx
            .update(invoices)
            .set({
                description: payload.description,
                note: payload.note,
                status: payload.status,
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId))
            .returning();

        // Update items if provided
        if (payload.items) {
            // Delete existing items
            await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

            // Insert new items
            const invoiceItemsData = payload.items.map((item) => ({
                invoiceId,
                productId: item.productId,
                quantity: item.quantity,
            }));

            await tx.insert(invoiceItems).values(invoiceItemsData);
        }

        return (await getInvoiceById(invoiceId))!;
    });
}

/**
 * Delete an invoice (SUPERADMIN only)
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
        throw new Error('Invoice not found');
    }

    // Delete items first (cascade should handle this, but explicit is safer)
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
}

/**
 * Get invoice by invoice number
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithItems | null> {
    const [invoice] = await db
        .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            description: invoices.description,
            status: invoices.status,
            createdBy: invoices.createdBy,
            note: invoices.note,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            creator: {
                id: users.id,
                fullName: users.fullName,
                username: users.username,
            },
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.createdBy, users.id))
        .where(eq(invoices.invoiceNumber, invoiceNumber));

    if (!invoice) return null;

    const items = await db
        .select({
            id: invoiceItems.id,
            invoiceId: invoiceItems.invoiceId,
            productId: invoiceItems.productId,
            productName: products.name,
            productUnit: products.unit,
            quantity: invoiceItems.quantity,
        })
        .from(invoiceItems)
        .leftJoin(products, eq(invoiceItems.productId, products.id))
        .where(eq(invoiceItems.invoiceId, invoice.id));

    return {
        ...invoice,
        items,
    };
}

/**
 * Approve an invoice - SUPERADMIN only
 * This will INCREASE stock for all items and set status to SUCCESS
 */
export async function approveInvoice(
    invoiceId: string,
    approverId: string
): Promise<InvoiceWithItems> {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
        throw new Error('Invoice not found');
    }

    if (invoice.status !== 'PENDING') {
        throw new Error('Can only approve PENDING invoices');
    }

    return await db.transaction(async (tx) => {
        // Process each item - INCREASE stock
        for (const item of invoice.items) {
            // Get current stock (if exists)
            const [existingStock] = await tx
                .select()
                .from(inventoryStocks)
                .where(eq(inventoryStocks.productId, item.productId))
                .for('update');

            if (existingStock) {
                // Update existing stock - INCREASE
                await tx
                    .update(inventoryStocks)
                    .set({
                        quantity: existingStock.quantity + item.quantity,
                        updatedAt: new Date(),
                    })
                    .where(eq(inventoryStocks.productId, item.productId));
            } else {
                // Create new stock entry
                await tx.insert(inventoryStocks).values({
                    productId: item.productId,
                    quantity: item.quantity,
                });
            }

            // Record inventory movement (IN)
            await tx.insert(inventoryMovements).values({
                productId: item.productId,
                quantity: item.quantity,
                movementType: 'IN',
                referenceTransaction: invoiceId,
                createdBy: approverId,
            });
        }

        // Update invoice status to SUCCESS
        await tx
            .update(invoices)
            .set({
                status: 'SUCCESS',
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId));

        return (await getInvoiceById(invoiceId))!;
    });
}

/**
 * Reject an invoice - SUPERADMIN only
 */
export async function rejectInvoice(
    invoiceId: string,
    _rejecterId: string
): Promise<InvoiceWithItems> {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
        throw new Error('Invoice not found');
    }

    if (invoice.status !== 'PENDING') {
        throw new Error('Can only reject PENDING invoices');
    }

    await db
        .update(invoices)
        .set({
            status: 'REJECTED',
            updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

    return (await getInvoiceById(invoiceId))!;
}
