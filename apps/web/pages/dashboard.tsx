import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import Link from 'next/link';
import LabLayout from '../components/Layouts/LabLayout';

interface InventoryItem {
    productId: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        unit: string;
        lowStockThreshold: number;
    };
}

interface Transaction {
    id: string;
    note: string | null;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
    };
    room: {
        id: string;
        name: string;
    };
}

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
}

const Dashboard = () => {
    const { user } = useSelector((state: IRootState) => state.auth);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
    const isGeneral = user?.role === 'GENERAL';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // GENERAL users can only see limited data
            if (isGeneral) {
                setIsLoading(false);
                return;
            }

            const [inventoryRes, lowStockRes, transactionsRes, notificationsRes] = await Promise.all([
                api.get<InventoryItem[]>('/inventory'),
                api.get<InventoryItem[]>('/inventory/low-stock'),
                api.get<Transaction[]>('/transactions'),
                api.get<Notification[]>('/notifications'),
            ]);

            if (inventoryRes.data) setInventory(inventoryRes.data);
            if (lowStockRes.data) setLowStockItems(lowStockRes.data);
            if (transactionsRes.data) setRecentTransactions(transactionsRes.data.slice(0, 5));
            if (notificationsRes.data) setNotifications(notificationsRes.data.slice(0, 5));

            setIsLoading(false);
        };

        fetchData();
    }, [isGeneral]);

    // Redirect GENERAL users to order page
    if (isGeneral) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
                    <p className="mt-2 text-gray-600">You don&apos;t have permission to view this page.</p>
                    <Link href="/order" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-white hover:opacity-90">
                        Go to Order
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold md:text-3xl">Welcome, {user?.fullName}!</h1>
                <p className="mt-1 text-gray-500">
                    Role: <span className="font-medium">{user?.role}</span>
                </p>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <div className="flex items-center">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Products</p>
                            <p className="text-xl font-bold">{inventory.length}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <div className="flex items-center">
                        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <p className="text-xl font-bold text-red-600">{lowStockItems.length}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <div className="flex items-center">
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Recent Transactions</p>
                            <p className="text-xl font-bold">{recentTransactions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <div className="flex items-center">
                        <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Notifications</p>
                            <p className="text-xl font-bold">{notifications.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
                <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    <Link href="/order" className="rounded-lg bg-primary p-4 text-center text-white transition hover:opacity-90">
                        <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm">Order Items</span>
                    </Link>

                    {isAdmin && (
                        <Link href="/inventory" className="rounded-lg bg-green-600 p-4 text-center text-white transition hover:opacity-90">
                            <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-sm">Inventory</span>
                        </Link>
                    )}

                    {isSuperAdmin && (
                        <>
                            <Link href="/products" className="rounded-lg bg-purple-600 p-4 text-center text-white transition hover:opacity-90">
                                <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="text-sm">Products</span>
                            </Link>

                            <Link href="/users" className="rounded-lg bg-orange-600 p-4 text-center text-white transition hover:opacity-90">
                                <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span className="text-sm">Users</span>
                            </Link>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <Link href="/transactions" className="rounded-lg bg-teal-600 p-4 text-center text-white transition hover:opacity-90">
                                <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span className="text-sm">Transactions</span>
                            </Link>

                            <Link href="/reports" className="rounded-lg bg-indigo-600 p-4 text-center text-white transition hover:opacity-90">
                                <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-sm">Reports</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Low Stock Alerts */}
                {lowStockItems.length > 0 && (
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-bold text-red-600">Low Stock Alerts</h3>
                        <div className="space-y-3">
                            {lowStockItems.slice(0, 5).map((item) => (
                                <div key={item.productId} className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                                    <div>
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-gray-500">{item.product.unit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">{item.quantity}</p>
                                        <p className="text-xs text-gray-500">Threshold: {item.product.lowStockThreshold}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 className="mb-4 text-lg font-bold">Recent Transactions</h3>
                    {recentTransactions.length === 0 ? (
                        <p className="text-gray-500">No recent transactions</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                    <div>
                                        <p className="font-medium">{tx.user?.fullName || 'Unknown'}</p>
                                        <p className="text-sm text-gray-500">{tx.room?.name || 'Unknown Room'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

(Dashboard as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(Dashboard);
