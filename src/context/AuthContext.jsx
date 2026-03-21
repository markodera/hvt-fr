import { createContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '@/api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        let cancelled = false;
        
        // Add a deliberate timeout so the UI doesn't hang forever if the backend is slow/failing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        getMe({ signal: controller.signal })
            .then((data) => {
                if (!cancelled) setUser(data);
            })
            .catch(() => {
                // If the user isn't logged in, getMe returns 401/403 which is expected.
                // Do not overwrite a user that may have just logged in while this bootstrap call was in flight.
                if (!cancelled) setUser((currentUser) => currentUser ?? null);
            })
            .finally(() => {
                clearTimeout(timeoutId);
                if (!cancelled) setIsLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    // Listen for forced logout from the interceptor
    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    const login = useCallback(async (credentials) => {
        const data = await apiLogin(credentials);
        if (data?.user) {
            setUser(data.user);
            return data;
        }

        // Fallback for backends that authenticate via cookies but do not include a user payload in login response.
        try {
            const me = await getMe();
            setUser(me);
            return me;
        } catch (error) {
            setUser(null);
            throw error;
        }
    }, []);

    const refreshSession = useCallback(async () => {
        try {
            const me = await getMe();
            setUser(me);
            return me;
        } catch (error) {
            setUser(null);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
