import { db, inventoryMovements, inventoryStocks, notifications, products } from '@laboratory/db';
import { eq, lt } from 'drizzle-orm';

export type RestockInventoryPayload = {
    productId: string;
    quantity: number;
    userId: string;
};

export type AdjustInventoryPayload = {
    productId: string;
    quantity: number;
    reason: string;
    userId: string;
};

export const listInventoryStocks = async () => {
    return db
        .select({
            productId: inventoryStocks.productId,
            quantity: inventoryStocks.quantity,
            updatedAt: inventoryStocks.updatedAt,
            product: products,
        })
        .from(inventoryStocks)
        .leftJoin(products, eq(inventoryStocks.productId, products.id));
};

export const listLowStockInventory = async () => {
    return db
        .select({
            productId: inventoryStocks.productId,
            quantity: inventoryStocks.quantity,
            product: products,
        })
        .from(inventoryStocks)
        .leftJoin(products, eq(inventoryStocks.productId, products.id))
        .where(lt(inventoryStocks.quantity, products.lowStockThreshold));
};

export const restockInventory = async ({ productId, quantity, userId }: RestockInventoryPayload) => {
    return db.transaction(async (tx) => {
        const [existing] = await tx.select().from(inventoryStocks).where(eq(inventoryStocks.productId, productId));

        const [result] = existing
            ? await tx
                  .update(inventoryStocks)
                  .set({
                      quantity: existing.quantity + quantity,
                      updatedAt: new Date(),
                  })
                  .where(eq(inventoryStocks.productId, productId))
                  .returning()
            : await tx.insert(inventoryStocks).values({ productId, quantity }).returning();

        await tx.insert(inventoryMovements).values({
            productId,
            quantity,
            movementType: 'IN',
            createdBy: userId,
        });

        return result;
    });
};

export const adjustInventory = async ({ productId, quantity, userId, reason }: AdjustInventoryPayload) => {
    return db.transaction(async (tx) => {
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

        if (product && quantity <= product.lowStockThreshold) {
            await tx.insert(notifications).values({
                title: 'Low Stock Alert',
                message: `Product ${product.name} is running low (${quantity} remaining). Reason: ${reason}`,
            });
        }

        return result;
    });
};
