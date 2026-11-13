// SPDX-License-Identifier: Apache-2.0
import { Key } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PersonalAccessTokensSection } from '@/pages/settings/PersonalAccessTokensSection';

export default function PersonalAccessTokensPage() {
    usePageTitle('Personal Access Tokens');

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-secondary text-primary">
                        <Key className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-text-primary">
                            Personal Access Tokens
                        </h1>
                        <p className="text-sm text-text-secondary">
                            Manage fine-grained personal tokens for CLI operations, declarative schema sync, and external CI/CD pipelines.
                        </p>
                    </div>
                </div>
            </div>

            <PersonalAccessTokensSection />
        </div>
    );
}
