import { db, products, inventoryStocks } from '@laboratory/db';
import { eq, lt, lte, and, desc } from 'drizzle-orm';
import { config } from '../../infrastructure/config';

export interface StockRatioItem {
    productId: string;
    productName: string;
    productUnit: string;
    currentQuantity: number;
    threshold: number;
    ratio: number; // Percentage of stock remaining relative to threshold
    status: 'healthy' | 'warning' | 'critical' | 'out_of_stock';
}

export interface OutOfStockItem {
    productId: string;
    productName: string;
    productUnit: string;
    currentQuantity: number;
    threshold: number;
    lastUpdated: Date | null;
}

export interface DashboardStats {
    totalProducts: number;
    totalInStock: number;
    lowStockCount: number;
    outOfStockCount: number;
}

export interface DashboardData {
    stats: DashboardStats;
    stockRatio: StockRatioItem[];     // Items with ratio (going out of stock)
    outOfStock: OutOfStockItem[];      // Items that are out of stock
    recentMovements: Array<{
        id: string;
        productName: string;
        quantity: number;
        movementType: string;
        createdAt: Date | null;
    }>;
}

/**
 * Calculate stock ratio percentage
 * Ratio = (current stock / threshold) * 100
 */
function calculateStockRatio(currentQuantity: number, threshold: number): number {
    if (threshold <= 0) return 100; // No threshold set, assume healthy
    return Math.round((currentQuantity / threshold) * 100);
}

/**
 * Determine stock status based on ratio and configuration
 */
function getStockStatus(ratio: number): 'healthy' | 'warning' | 'critical' | 'out_of_stock' {
    const warningLevel = config.dashboard?.stock?.warningLevel ?? 50;
    const criticalLevel = config.dashboard?.stock?.criticalLevel ?? 25;
    const outOfStockLevel = config.dashboard?.stock?.outOfStockLevel ?? 0;

    if (ratio <= outOfStockLevel) return 'out_of_stock';
    if (ratio <= criticalLevel) return 'critical';
    if (ratio <= warningLevel) return 'warning';
    return 'healthy';
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    // Get all products with their stock
    const allStock = await db
        .select({
            productId: products.id,
            threshold: products.lowStockThreshold,
            quantity: inventoryStocks.quantity,
            isActive: products.isActive,
        })
        .from(products)
        .leftJoin(inventoryStocks, eq(products.id, inventoryStocks.productId))
        .where(eq(products.isActive, true));

    const warningLevel = config.dashboard?.stock?.warningLevel ?? 50;

    let totalInStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of allStock) {
        const quantity = item.quantity ?? 0;
        const threshold = item.threshold ?? 10;

        if (quantity > 0) {
            totalInStock++;
        }

        const ratio = calculateStockRatio(quantity, threshold);

        if (quantity <= 0) {
            outOfStockCount++;
        } else if (ratio <= warningLevel) {
            lowStockCount++;
        }
    }

    return {
        totalProducts: allStock.length,
        totalInStock,
        lowStockCount,
        outOfStockCount,
    };
}

/**
 * Get items with stock ratio (showing which items are going out of stock)
 * Sorted by ratio ascending (most critical first)
 */
export async function getStockRatioItems(): Promise<StockRatioItem[]> {
    const warningLevel = config.dashboard?.stock?.warningLevel ?? 50;

    // Get all products with their stock
    const allStock = await db
        .select({
            productId: products.id,
            productName: products.name,
            productUnit: products.unit,
            threshold: products.lowStockThreshold,
            quantity: inventoryStocks.quantity,
            isActive: products.isActive,
        })
        .from(products)
        .leftJoin(inventoryStocks, eq(products.id, inventoryStocks.productId))
        .where(eq(products.isActive, true));

    const items: StockRatioItem[] = [];

    for (const item of allStock) {
        const quantity = item.quantity ?? 0;
        const threshold = item.threshold ?? 10;
        const ratio = calculateStockRatio(quantity, threshold);
        const status = getStockStatus(ratio);

        // Only include items that are at or below warning level
        if (ratio <= warningLevel || quantity <= 0) {
            items.push({
                productId: item.productId,
                productName: item.productName,
                productUnit: item.productUnit,
                currentQuantity: quantity,
                threshold,
                ratio,
                status,
            });
        }
    }

    // Sort by ratio ascending (most critical first)
    return items.sort((a, b) => a.ratio - b.ratio);
}

/**
 * Get items that are completely out of stock
 */
export async function getOutOfStockItems(): Promise<OutOfStockItem[]> {
    // Products with zero or null stock
    const outOfStock = await db
        .select({
            productId: products.id,
            productName: products.name,
            productUnit: products.unit,
            threshold: products.lowStockThreshold,
            quantity: inventoryStocks.quantity,
            updatedAt: inventoryStocks.updatedAt,
            isActive: products.isActive,
        })
        .from(products)
        .leftJoin(inventoryStocks, eq(products.id, inventoryStocks.productId))
        .where(
            and(
                eq(products.isActive, true),
                lte(inventoryStocks.quantity, 0)
            )
        );

    return outOfStock.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productUnit: item.productUnit,
        currentQuantity: item.quantity ?? 0,
        threshold: item.threshold ?? 0,
        lastUpdated: item.updatedAt,
    }));
}

/**
 * Get all dashboard data in one call
 */
export async function getDashboardData(): Promise<DashboardData> {
    const [stats, stockRatio, outOfStock] = await Promise.all([
        getDashboardStats(),
        getStockRatioItems(),
        getOutOfStockItems(),
    ]);

    return {
        stats,
        stockRatio,
        outOfStock,
        recentMovements: [], // Will be implemented with inventory movements
    };
}

/**
 * Get stock summary by status
 */
export async function getStockSummaryByStatus(): Promise<{
    healthy: number;
    warning: number;
    critical: number;
    outOfStock: number;
}> {
    const items = await getStockRatioItems();

    return {
        healthy: items.filter((i) => i.status === 'healthy').length,
        warning: items.filter((i) => i.status === 'warning').length,
        critical: items.filter((i) => i.status === 'critical').length,
        outOfStock: items.filter((i) => i.status === 'out_of_stock').length,
    };
}
