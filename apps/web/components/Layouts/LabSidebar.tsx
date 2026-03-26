import { useSelector, useDispatch } from 'react-redux';
import { IRootState } from '../../store';
import { logout } from '../../store/authSlice';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';

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

const LabSidebar = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state: IRootState) => state.auth);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [collapsed, setCollapsed] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const notificationRef = useRef<HTMLDivElement>(null);

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
    const isGeneral = user?.role === 'GENERAL';

    // Fetch recent transactions for notifications
    useEffect(() => {
        if (isAdmin) {
            const fetchTransactions = async () => {
                const response = await api.get<Transaction[]>('/transactions');
                if (response.data) {
                    setRecentTransactions(response.data.slice(0, 3));
                }
            };
            fetchTransactions();
        }
    }, [isAdmin]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // GENERAL users don't see sidebar
    if (isGeneral) {
        return null;
    }

    const handleLogout = async () => {
        await dispatch(logout());
        router.push('/auth/login');
    };

    const isActive = (path: string) => router.pathname === path;

    // Admin/SuperAdmin menu
    const menuItems = [
        {
            label: 'Order Items',
            path: '/order',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN'],
        },
        {
            label: 'Transactions',
            path: '/transactions',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN'],
        },
        {
            label: 'Inventory',
            path: '/inventory',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN'],
        },
        {
            label: 'Products',
            path: '/products',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            roles: ['SUPERADMIN'],
        },
        {
            label: 'Users',
            path: '/users',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            roles: ['SUPERADMIN'],
        },
        {
            label: 'Reports',
            path: '/reports',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN'],
        },
    ];

    // Filter menu based on user role (GENERAL users already returned null above)
    const filteredMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));

    if (!isAuthenticated) {
        return null;
    }

    return (
        <aside
            className={`fixed left-0 top-0 z-50 h-screen bg-white shadow-lg transition-all duration-300 dark:bg-gray-900 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center">
                        <span className="truncate text-xl font-bold text-primary">Lab Inventory</span>
                    </Link>
                )}
                <div className="flex items-center gap-2">
                    {/* Notification Bell - Only for Admin/SuperAdmin */}
                    {isAdmin && !collapsed && (
                        <div className="relative" ref={notificationRef}>
                            <button
                                type="button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative block rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.0001 9.7041V9C19.0001 5.13401 15.8661 2 12.0001 2C8.13407 2 5.00006 5.13401 5.00006 9V9.7041C5.00006 10.5491 4.74995 11.3752 4.28123 12.0783L3.13263 13.8012C2.08349 15.3749 2.88442 17.5139 4.70913 18.0116C9.48258 19.3134 14.5175 19.3134 19.291 18.0116C21.1157 17.5139 21.9166 15.3749 20.8675 13.8012L19.7189 12.0783C19.2502 11.3752 19.0001 10.5491 19.0001 9.7041Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M12 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                {recentTransactions.length > 0 && (
                                    <span className="absolute top-0 flex h-3 w-3 ltr:right-0 rtl:left-0">
                                        <span className="absolute -top-[3px] inline-flex h-full w-full animate-ping rounded-full bg-success/50 opacity-75 ltr:-left-[3px] rtl:-right-[3px]"></span>
                                        <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-success"></span>
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <h4 className="mb-3 font-bold">Recent Transactions</h4>
                                    {recentTransactions.length === 0 ? (
                                        <p className="text-sm text-gray-500">No recent transactions</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentTransactions.map((tx) => (
                                                <div key={tx.id} className="border-b border-gray-100 pb-2 last:border-0 dark:border-gray-700">
                                                    <p className="text-sm font-medium">{tx.user?.fullName || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{tx.room?.name || 'Unknown Room'}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Link
                                        href="/transactions"
                                        className="mt-3 block w-full rounded-lg bg-primary py-2 text-center text-sm text-white hover:opacity-90"
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        Read All Notifications
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-4 px-2">
                <ul className="space-y-1">
                    {filteredMenuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={item.path}
                                className={`flex items-center rounded-lg px-3 py-2.5 transition ${isActive(item.path)
                                    ? 'bg-primary text-white'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {item.icon}
                                {!collapsed && <span className="ml-3">{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Info & Logout */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 dark:border-gray-700">
                {!collapsed && (
                    <div className="mb-3">
                        <p className="font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
                        <p className="text-sm text-gray-500">{user?.role}</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span className="ml-3">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default LabSidebar;
