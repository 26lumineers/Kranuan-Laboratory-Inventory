import { useSelector, useDispatch } from 'react-redux';
import { IRootState } from '../../store';
import { logout } from '../../store/authSlice';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const LabSidebar = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state: IRootState) => state.auth);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [collapsed, setCollapsed] = useState(false);

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;

    const handleLogout = async () => {
        await dispatch(logout());
        router.push('/auth/login');
    };

    const isActive = (path: string) => router.pathname === path;

    const menuItems = [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN', 'GENERAL'],
        },
        {
            label: 'Order Items',
            path: '/order',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN', 'GENERAL'],
        },
        {
            label: 'Transactions',
            path: '/transactions',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            roles: ['SUPERADMIN', 'ADMIN', 'GENERAL'],
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

    const filteredMenuItems = menuItems.filter(item =>
        user && item.roles.includes(user.role)
    );

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
                        <span className="text-xl font-bold text-primary">Lab Inventory</span>
                    </Link>
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
