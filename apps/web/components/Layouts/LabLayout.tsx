import { ReactElement, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IRootState } from '../../store';
import { fetchCurrentUser } from '../../store/authSlice';
import { useRouter } from 'next/router';
import LabSidebar from './LabSidebar';

interface LabLayoutProps {
    children: ReactElement;
}

const LabLayout = ({ children }: LabLayoutProps) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, token, user, isLoading } = useSelector((state: IRootState) => state.auth);

    const isGeneral = user?.role === 'GENERAL';

    useEffect(() => {
        if (token && !user) {
            dispatch(fetchCurrentUser());
        }
    }, [token, user, dispatch]);

    useEffect(() => {
        if (!token && !isLoading) {
            router.replace('/auth/login');
        }
    }, [token, isLoading, router]);

    // Redirect GENERAL users to /order page
    useEffect(() => {
        if (isGeneral && router.pathname !== '/order') {
            router.replace('/order');
        }
    }, [isGeneral, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // GENERAL users: no sidebar, full-width content
    if (isGeneral) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <LabSidebar />
            <main className="ml-64 min-h-screen transition-all duration-300">
                {children}
            </main>
        </div>
    );
};

export default LabLayout;
