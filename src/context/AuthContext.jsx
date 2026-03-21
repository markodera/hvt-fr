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
                if (!cancelled) setUser(null);
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
        setUser(data.user);
        return data;
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
