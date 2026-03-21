import { useCallback, useMemo } from 'react';

const STORAGE_KEY = 'hvt:onboarding:v1';

const defaultState = {
    orgProfileCompleted: false,
    apiKeyCreated: false,
    webhookConfigured: false,
    testEventVerified: false,
    completedAt: null,
};

function readStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useOnboarding(orgId) {
    const state = useMemo(() => {
        if (!orgId) return defaultState;
        const store = readStore();
        return { ...defaultState, ...(store[orgId] || {}) };
    }, [orgId]);

    const updateState = useCallback((updates) => {
        if (!orgId) return;
        const store = readStore();
        const next = {
            ...defaultState,
            ...(store[orgId] || {}),
            ...updates,
        };

        const isComplete = (
            next.orgProfileCompleted
            && next.apiKeyCreated
            && next.webhookConfigured
            && next.testEventVerified
        );

        if (isComplete && !next.completedAt) {
            next.completedAt = new Date().toISOString();
        }

        store[orgId] = next;
        writeStore(store);
    }, [orgId]);

    const steps = useMemo(() => ([
        { key: 'orgProfileCompleted', label: 'Review organization profile' },
        { key: 'apiKeyCreated', label: 'Create your first API key' },
        { key: 'webhookConfigured', label: 'Configure a webhook endpoint' },
        { key: 'testEventVerified', label: 'Confirm an event appears in audit logs' },
    ]), []);

    const completedCount = steps.filter((step) => state[step.key]).length;
    const totalCount = steps.length;
    const isComplete = completedCount === totalCount;

    return {
        state,
        steps,
        completedCount,
        totalCount,
        isComplete,
        updateState,
    };
}
