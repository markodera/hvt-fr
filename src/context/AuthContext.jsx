import { createContext, useState, useEffect, useCallback, useRef } from 'react';

import { getMe, login as apiLogin, logout as apiLogout } from '@/api/auth';
import { hvt, isAuthFailure, refreshDashboardSession } from '@/lib/hvt';

const INITIAL_SESSION_TIMEOUT_MS = 10000;
const DASHBOARD_AUTH_EXEMPT_PATH_PREFIXES = [
    '/runtime-playground',
    '/runtime-demo',
    '/auth/google/callback',
    '/auth/github/callback',
];

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

function delay(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function shouldSkipDashboardBootstrap(pathname) {
    return DASHBOARD_AUTH_EXEMPT_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const userRef = useRef(null);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        const currentPathname = typeof window === 'undefined' ? '' : window.location.pathname || '';
        if (shouldSkipDashboardBootstrap(currentPathname)) {
            setIsLoading(false);
            return undefined;
        }

        let cancelled = false;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), INITIAL_SESSION_TIMEOUT_MS);
        const bootstrapAccessToken = hvt.accessToken;

        async function bootstrapSession() {
            try {
                const data = await getMe({ signal: controller.signal });
                if (cancelled) {
                    return;
                }

                setUser(data);

                if (!hvt.accessToken) {
                    refreshDashboardSession().catch(() => {
                        // Cookie auth already proved the session is valid. If this silent
                        // refresh misses, keep the current session and let the next request retry.
                    });
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                if (controller.signal.aborted) {
                    setUser((currentUser) => currentUser ?? null);
                    return;
                }

                try {
                    await refreshDashboardSession();
                    const data = await getMe({ signal: controller.signal });
                    if (!cancelled) {
                        setUser(data);
                    }
                } catch (refreshError) {
                    if (!cancelled) {
                        const bootstrapTokenStillCurrent = hvt.accessToken === bootstrapAccessToken;
                        if (
                            (isAuthFailure(error) || isAuthFailure(refreshError)) &&
                            bootstrapTokenStillCurrent
                        ) {
                            hvt.setAccessToken(null);
                            setUser(null);
                        } else {
                            setUser((currentUser) => currentUser ?? null);
                        }
                    }
                }
            } finally {
                window.clearTimeout(timeoutId);
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        bootstrapSession();

        return () => {
            cancelled = true;
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        const handleLogout = () => {
            hvt.setAccessToken(null);
            setUser(null);
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    const refreshSession = useCallback(async ({ clearOnError = true } = {}) => {
        try {
            const me = await getMe();
            setUser(me);
            return me;
        } catch (error) {
            if (clearOnError && isAuthFailure(error)) {
                hvt.setAccessToken(null);
                setUser(null);
            }
            throw error;
        }
    }, []);

    const waitForSession = useCallback(async ({ attempts = 5, delayMs = 600 } = {}) => {
        if (userRef.current) {
            return userRef.current;
        }

        let lastError = null;

        for (let attempt = 0; attempt < attempts; attempt += 1) {
            if (userRef.current) {
                return userRef.current;
            }

            try {
                return await refreshSession({ clearOnError: false });
            } catch (error) {
                lastError = error;
                if (attempt < attempts - 1) {
                    await delay(delayMs);
                }
            }
        }

        setUser((currentUser) => currentUser ?? null);
        throw lastError;
    }, [refreshSession]);

    const login = useCallback(async (credentials) => {
        const session = await apiLogin(credentials);
        if (session?.access) {
            hvt.setAccessToken(session.access);
        }
        return waitForSession();
    }, [waitForSession]);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } finally {
            hvt.setAccessToken(null);
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
        waitForSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
