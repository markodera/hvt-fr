import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/api/organizations';
import { ProjectSocialProvidersSection } from '@/pages/settings/ProjectSocialProvidersSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function SocialProvidersTab() {
    const [selectedProjectId, setSelectedProjectId] = useState('');

    const { data: projectsData, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: listProjects,
    });

    const projects = projectsData?.results ?? projectsData ?? [];

    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    if (projectsLoading) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    if (projects.length === 0) {
        return (
            <section>
                <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-12 text-center">
                    <p className="text-[#a1a1aa] text-sm">Create a project first to configure social providers.</p>
                </div>
            </section>
        );
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-[#18181b] border border-[#27272a] text-white text-sm rounded-lg focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full sm:w-64 p-2.5"
                    >
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <p className="text-sm text-[#71717a] mb-6">
                Managing provider settings for <strong className="text-white font-medium">{selectedProject?.name}</strong>
            </p>

            <div className="bg-[#111111] rounded-xl border border-[#27272a] p-6 shadow-sm">
                <ProjectSocialProvidersSection projectId={selectedProjectId} />
            </div>
        </section>
    );
}