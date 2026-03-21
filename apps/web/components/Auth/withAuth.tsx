import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { IRootState } from '../../store';
import { fetchCurrentUser } from '../../store/authSlice';
import { ReactElement, ComponentType } from 'react';
import { UserRole } from '../../store/authSlice';

interface WithAuthOptions {
    requiredRoles?: UserRole[];
}

export function withAuth<P extends object>(
    WrappedComponent: ComponentType<P>,
    options: WithAuthOptions = {}
) {
    const { requiredRoles } = options;

    const AuthenticatedComponent = (props: P) => {
        const router = useRouter();
        const dispatch = useDispatch();
        const { isAuthenticated, isLoading, user, token } = useSelector(
            (state: IRootState) => state.auth
        );

        useEffect(() => {
            if (token && !user) {
                dispatch(fetchCurrentUser());
            }
        }, [token, user, dispatch]);

        useEffect(() => {
            if (!token && !isLoading) {
                router.replace('/auth/login');
            } else if (isAuthenticated && user && requiredRoles) {
                if (!requiredRoles.includes(user.role)) {
                    router.replace('/unauthorized');
                }
            }
        }, [isAuthenticated, isLoading, user, token, router]);

        if (isLoading) {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading...</p>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated || !user) {
            return null;
        }

        if (requiredRoles && !requiredRoles.includes(user.role)) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return AuthenticatedComponent;
}
