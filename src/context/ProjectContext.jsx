import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { listProjects } from '@/api/organizations';
import { useAuth } from '@/hooks/useAuth';

export const ProjectContext = createContext(null);

const STORAGE_KEYS = {
    PROJECT: 'hvt_active_project_id',
    ENVIRONMENT: 'hvt_active_environment',
};

export function ProjectProvider({ children }) {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const hasOrganization = Boolean(user?.organization);

    const [environment, setEnvironmentState] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEYS.ENVIRONMENT) || 'test';
        } catch {
            return 'test';
        }
    });

    const [selectedProjectId, setSelectedProjectIdState] = useState(() => {
        const fromUrl = searchParams.get('project');
        if (fromUrl) return fromUrl;
        try {
            return localStorage.getItem(STORAGE_KEYS.PROJECT) || '';
        } catch {
            return '';
        }
    });

    const projectsQuery = useQuery({
        queryKey: ['projects', { organization: user?.organization?.id }],
        queryFn: async () => {
            const res = await listProjects({ page_size: 100 });
            return res?.results || res || [];
        },
        enabled: hasOrganization,
        staleTime: 60_000,
    });

    const projects = useMemo(() => {
        return Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
    }, [projectsQuery.data]);

    const activeProject = useMemo(() => {
        if (!projects.length) return null;
        if (selectedProjectId) {
            const found = projects.find(
                (p) => p.id === selectedProjectId || p.slug === selectedProjectId,
            );
            if (found) return found;
        }
        return projects[0];
    }, [projects, selectedProjectId]);

    useEffect(() => {
        if (activeProject?.id && activeProject.id !== selectedProjectId) {
            setSelectedProjectIdState(activeProject.id);
            try {
                localStorage.setItem(STORAGE_KEYS.PROJECT, activeProject.id);
            } catch {
                // ignore storage failure
            }
        }
    }, [activeProject, selectedProjectId]);

    const setEnvironment = useCallback((env) => {
        const next = env === 'live' ? 'live' : 'test';
        setEnvironmentState(next);
        try {
            localStorage.setItem(STORAGE_KEYS.ENVIRONMENT, next);
        } catch {
            // ignore
        }
    }, []);

    const selectProject = useCallback((projectIdOrSlug) => {
        setSelectedProjectIdState(projectIdOrSlug);
        try {
            localStorage.setItem(STORAGE_KEYS.PROJECT, projectIdOrSlug);
        } catch {
            // ignore
        }
        const currentUrlParam = searchParams.get('project');
        if (currentUrlParam !== projectIdOrSlug) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('project', projectIdOrSlug);
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const value = useMemo(
        () => ({
            projects,
            activeProject,
            activeProjectId: activeProject?.id || '',
            activeProjectSlug: activeProject?.slug || '',
            activeProjectName: activeProject?.name || '',
            environment,
            setEnvironment,
            selectProject,
            isLoading: projectsQuery.isLoading,
            isError: projectsQuery.isError,
            refetchProjects: projectsQuery.refetch,
        }),
        [projects, activeProject, environment, setEnvironment, selectProject, projectsQuery.isLoading, projectsQuery.isError, projectsQuery.refetch],
    );

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
