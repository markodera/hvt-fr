// SPDX-License-Identifier: Apache-2.0
import { Mail } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ProjectEmailConfigSection } from '@/pages/settings/ProjectEmailConfigSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function EmailSettingsPage() {
    usePageTitle('Email Delivery');
    const { projects, loading } = useProject();

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-secondary text-primary">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-text-primary">
                            Email Delivery & Providers
                        </h1>
                        <p className="text-sm text-text-secondary">
                            Configure Bring-Your-Own (BYO) email providers for authentication emails, password resets, and verification links.
                        </p>
                    </div>
                </div>
            </div>

            <ProjectEmailConfigSection projects={projects} />
        </div>
    );
}
