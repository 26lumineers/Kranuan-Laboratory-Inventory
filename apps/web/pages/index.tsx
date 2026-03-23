import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { IRootState } from '../store';

const Index = () => {
    const router = useRouter();
    const { isAuthenticated, token, user } = useSelector((state: IRootState) => state.auth);

    useEffect(() => {
        if (isAuthenticated && token) {
            // Redirect GENERAL users to /order, ADMIN/SUPERADMIN to /dashboard
            if (user?.role === 'GENERAL') {
                router.replace('/order');
            } else {
                router.replace('/dashboard');
            }
        } else {
            router.replace('/auth/login');
        }
    }, [isAuthenticated, token, user, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-500">Redirecting...</p>
            </div>
        </div>
    );
};

export default Index;
