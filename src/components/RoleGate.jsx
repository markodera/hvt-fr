import { useAuth } from '@/hooks/useAuth';

/**
 * Hides children if user doesn't have the required role
 * @param {{ allowedRoles: string[], children: React.ReactNode, fallback?: React.ReactNode }} props
 */
export function RoleGate({ allowedRoles, children, fallback = null }) {
    const { user } = useAuth();

    if (!user || !allowedRoles.includes(user.role)) {
        return fallback;
    }

    return children;
}
