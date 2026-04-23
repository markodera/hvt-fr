import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, LockKeyhole, LogOut, Pencil, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import {
    createProject,
    deleteProject,
    getCurrentOrg,
    listProjects,
    updateOrg,
    updateProject,
} from '@/api/organizations';
import { changePassword, updateProfile } from '@/api/auth';
import {
    changePasswordSchema,
    createProjectSchema,
    orgSettingsSchema,
    profileSchema,
} from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectSocialProvidersSection } from '@/pages/settings/ProjectSocialProvidersSection';
import { ProjectAccessManager } from '@/components/dashboard/ProjectAccessManager';

function SectionCard({ label, title, description, children }) {
    return (
        <section className="rounded-2xl border border-[#27272a] bg-[#18181b] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">{label}</p>
            <div className="mt-3">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description ? <p className="mt-1 text-sm text-[#a1a1aa]">{description}</p> : null}
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#7c3aed]' : 'border border-[#27272a] bg-[#111111]'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );
}

function LoadingGrid() {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-2xl border border-[#27272a] bg-[#18181b]" />
            ))}
        </div>
    );
}

const textareaClassName = 'min-h-[120px] w-full rounded-md border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white placeholder:text-[#52525b] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25';

function splitMultilineValues(value = '') {
    return String(value)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function formatAllowedOrigins(origins = []) {
    return (origins || []).join('\n');
}

function buildProjectFormDefaults(project = null, fallbackAllowSignup = false) {
    return {
        name: project?.name || '',
        slug: project?.slug || '',
        allow_signup: project?.allow_signup ?? fallbackAllowSignup,
        frontend_url: project?.frontend_url || '',
        allowed_origins_text: formatAllowedOrigins(project?.allowed_origins || []),
    };
}

function toProjectPayload(values) {
    const { allowed_origins_text, ...rest } = values;
    return {
        ...rest,
        allowed_origins: splitMultilineValues(allowed_origins_text),
    };
}

import { usePageTitle } from '@/hooks/usePageTitle';

export default function SettingsPage() {
    usePageTitle('Settings');
    const queryClient = useQueryClient();
    const { user, refreshSession, logout } = useAuth();
    const [editingProject, setEditingProject] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { data: org, isLoading: orgLoading } = useQuery({
        queryKey: ['organization'],
        queryFn: getCurrentOrg,
    });

    const { data: projectsData, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: listProjects,
    });

    const projects = projectsData?.results ?? projectsData ?? [];

    const orgForm = useForm({
        resolver: zodResolver(orgSettingsSchema),
        defaultValues: { name: '', slug: '', allow_signup: false },
    });

    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { first_name: '', last_name: '' },
    });

    const passwordForm = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { old_password: '', new_password1: '', new_password2: '' },
    });

    const projectForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: buildProjectFormDefaults(),
    });

    const editProjectForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: buildProjectFormDefaults(),
    });

    useEffect(() => {
        if (!org) {
            return;
        }

        orgForm.reset({
            name: org.name,
            slug: org.slug,
            allow_signup: org.allow_signup,
        });

        projectForm.reset(buildProjectFormDefaults(null, org.allow_signup));
    }, [org, orgForm, projectForm]);

    useEffect(() => {
        if (!user) {
            return;
        }

        profileForm.reset({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
        });
    }, [profileForm, user]);

    useEffect(() => {
        if (!editingProject) {
            return;
        }

        editProjectForm.reset(buildProjectFormDefaults(editingProject));
    }, [editProjectForm, editingProject]);

    function invalidateProjectQueries() {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    }

    async function handleLogout() {
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            setIsLoggingOut(false);
            toast.error(getErrorMessage(error));
        }
    }

    const orgMutation = useMutation({
        mutationFn: updateOrg,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization'] });
            invalidateProjectQueries();
            toast.success('Organisation settings saved');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async () => {
            await refreshSession({ clearOnError: false });
            toast.success('Profile saved');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const passwordMutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            passwordForm.reset();
            toast.success('Password updated');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const projectMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            invalidateProjectQueries();
            projectForm.reset(buildProjectFormDefaults(null, org?.allow_signup ?? false));
            toast.success('Project created');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const updateProjectMutation = useMutation({
        mutationFn: ({ id, data }) => updateProject(id, data),
        onSuccess: () => {
            invalidateProjectQueries();
            setEditingProject(null);
            toast.success('Project updated');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const deleteProjectMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            invalidateProjectQueries();
            setDeleteTarget(null);
            toast.success('Project deleted');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    if (orgLoading || !user) {
        return <LoadingGrid />;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard
                    label="Profile"
                    title="Profile details"
                    description="Update the control-plane identity shown across the dashboard."
                >
                    <form onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Email</Label>
                            <Input
                                value={user.email || ''}
                                disabled
                                className="h-10 border-[#27272a] bg-[#111111] text-white disabled:opacity-70"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">First name</Label>
                                <Input
                                    {...profileForm.register('first_name')}
                                    className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Last name</Label>
                                <Input
                                    {...profileForm.register('last_name')}
                                    className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={profileMutation.isPending || !profileForm.formState.isDirty}
                            className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                        >
                            {profileMutation.isPending ? 'Saving...' : 'Save changes'}
                        </Button>
                    </form>
                </SectionCard>

                <SectionCard
                    label="Security"
                    title="Password"
                    description="Change the password for this HVT account or open the reset flow."
                >
                    <form onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Current password</Label>
                            <Input
                                type="password"
                                {...passwordForm.register('old_password')}
                                className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">New password</Label>
                                <Input
                                    type="password"
                                    {...passwordForm.register('new_password1')}
                                    className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Confirm password</Label>
                                <Input
                                    type="password"
                                    {...passwordForm.register('new_password2')}
                                    className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Link to="/forgot-password" className="text-sm text-[#a78bfa] transition-colors hover:text-white">
                                Open password reset
                            </Link>
                            <Button
                                type="submit"
                                disabled={passwordMutation.isPending}
                                className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                            >
                                {passwordMutation.isPending ? 'Updating...' : 'Change password'}
                            </Button>
                        </div>
                    </form>
                </SectionCard>

                <div className="md:hidden">
                    <SectionCard
                        label="Session"
                        title="Sign out"
                        description="Quick access to sign out when you are using the dashboard on mobile."
                    >
                        <Button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full border border-[#27272a] bg-transparent text-white hover:bg-[#18181b]"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {isLoggingOut ? 'Signing out...' : 'Log out'}
                        </Button>
                    </SectionCard>
                </div>
            </div>

            <SectionCard
                label="Organisation"
                title="Organisation settings"
                description="These defaults affect sign-up behaviour and organisation-wide metadata."
            >
                <form onSubmit={orgForm.handleSubmit((values) => orgMutation.mutate(values))} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Organisation name</Label>
                            <Input
                                {...orgForm.register('name')}
                                className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Slug</Label>
                            <Input
                                {...orgForm.register('slug')}
                                className="h-10 border-[#27272a] bg-[#111111] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-[#27272a] bg-[#111111] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">Allow public sign-up</p>
                            <p className="text-xs text-[#71717a]">New default-project keys inherit this setting.</p>
                        </div>
                        <Toggle
                            checked={orgForm.watch('allow_signup')}
                            onChange={() =>
                                orgForm.setValue('allow_signup', !orgForm.watch('allow_signup'), {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={orgMutation.isPending || !orgForm.formState.isDirty}
                        className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                    >
                        {orgMutation.isPending ? 'Saving...' : 'Save organisation'}
                    </Button>
                </form>
            </SectionCard>

            <SectionCard
                label="Projects"
                title="Project boundaries"
                description="Projects scope API keys, app tokens, social providers, sign-up controls, and app email destinations."
            >
                <div className="space-y-4">
                    {projectsLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="h-20 animate-pulse rounded-xl bg-[#111111]" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] px-4 py-6 text-sm text-[#71717a]">
                            No projects yet. Create one below.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map((project) => (
                                <div key={project.id} className="rounded-xl border border-[#27272a] bg-[#111111] px-4 py-4">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-white">{project.name}</p>
                                                {project.is_default ? (
                                                    <span className="rounded-full border border-[#27272a] px-2 py-0.5 text-[11px] text-[#a1a1aa]">
                                                        default
                                                    </span>
                                                ) : null}
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[11px] ${project.is_active
                                                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                                            : 'border border-[#27272a] bg-[#18181b] text-[#a1a1aa]'
                                                        }`}
                                                >
                                                    {project.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[11px] ${project.allow_signup
                                                            ? 'border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#c4b5fd]'
                                                            : 'border border-[#27272a] bg-[#18181b] text-[#a1a1aa]'
                                                        }`}
                                                >
                                                    {project.allow_signup ? 'Signup open' : 'Signup closed'}
                                                </span>
                                            </div>
                                            <p className="mt-2 font-mono text-xs text-[#a78bfa]">{project.slug}</p>
                                            {project.frontend_url ? (
                                                <p className="mt-2 break-all text-xs text-[#a1a1aa]">
                                                    App frontend: <span className="font-mono text-[#d4d4d8]">{project.frontend_url}</span>
                                                </p>
                                            ) : null}
                                            {project.allowed_origins?.length ? (
                                                <p className="mt-2 break-all text-xs text-[#a1a1aa]">
                                                    Extra app origins: <span className="font-mono text-[#d4d4d8]">{project.allowed_origins.join(', ')}</span>
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingProject(project)}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#27272a] px-3 text-sm font-medium text-white transition-colors hover:bg-[#18181b]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </button>
                                            {!project.is_default ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(project)}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/15"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-4">
                        <p className="text-sm font-medium text-white">Create project</p>
                        <p className="mt-1 text-sm text-[#71717a]">Use a separate project for each app or environment.</p>

                        <form onSubmit={projectForm.handleSubmit((values) => projectMutation.mutate(toProjectPayload(values)))} className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Project name</Label>
                                <Input
                                    {...projectForm.register('name')}
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Project slug</Label>
                                <Input
                                    {...projectForm.register('slug')}
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">App frontend URL</Label>
                                <Input
                                    {...projectForm.register('frontend_url')}
                                    placeholder="https://app.example.com"
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                />
                                {projectForm.formState.errors.frontend_url ? (
                                    <p className="text-xs text-rose-300">{projectForm.formState.errors.frontend_url.message}</p>
                                ) : null}
                                <p className="text-xs text-[#71717a]">
                                    Optional. Verification and password-reset emails will link to this frontend when this project API key is used.
                                </p>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Allowed origins</Label>
                                <textarea
                                    {...projectForm.register('allowed_origins_text')}
                                    rows={4}
                                    placeholder={`https://preview.example.com\nhttp://localhost:3000`}
                                    className={textareaClassName}
                                />
                                {projectForm.formState.errors.allowed_origins_text ? (
                                    <p className="text-xs text-rose-300">{projectForm.formState.errors.allowed_origins_text.message}</p>
                                ) : null}
                                <p className="text-xs text-[#71717a]">
                                    Optional. One origin per line. Live app keys accept browser requests only from these origins plus the app frontend URL above. Test keys also allow localhost automatically.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">Allow public sign-up</p>
                                    <p className="text-xs text-[#71717a]">Applies when this project key is used for app sign-up.</p>
                                </div>
                                <Toggle
                                    checked={projectForm.watch('allow_signup')}
                                    onChange={() =>
                                        projectForm.setValue('allow_signup', !projectForm.watch('allow_signup'), {
                                            shouldDirty: true,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex justify-end md:col-span-2">
                                <Button
                                    type="submit"
                                    disabled={projectMutation.isPending}
                                    className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto"
                                >
                                    {projectMutation.isPending ? 'Creating...' : 'Create project'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                label="App Access"
                title="Project app roles and permissions"
                description="Owners and admins can define dynamic app permissions, bundle them into roles, and control the roles developers or invitees can receive."
            >
                <ProjectAccessManager projects={projects} />
            </SectionCard>

            <SectionCard
                label="Social Providers"
                title="Per-project provider credentials"
                description="Google and GitHub OAuth settings are isolated per project."
            >
                <ProjectSocialProvidersSection projects={projects} />
            </SectionCard>

            <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
                <DialogContent className="max-w-xl border-[#27272a] bg-[#111111] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-[-0.03em] text-white">Edit project</DialogTitle>
                        <DialogDescription className="text-[#71717a]">
                            Update the project name, slug, sign-up behavior, and app email destination.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={editProjectForm.handleSubmit((values) =>
                            updateProjectMutation.mutate({ id: editingProject.id, data: toProjectPayload(values) })
                        )}
                        className="mt-4 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Project name</Label>
                            <Input
                                {...editProjectForm.register('name')}
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Project slug</Label>
                            <Input
                                {...editProjectForm.register('slug')}
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">App frontend URL</Label>
                            <Input
                                {...editProjectForm.register('frontend_url')}
                                placeholder="https://app.example.com"
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                            {editProjectForm.formState.errors.frontend_url ? (
                                <p className="text-xs text-rose-300">{editProjectForm.formState.errors.frontend_url.message}</p>
                            ) : null}
                            <p className="text-xs text-[#71717a]">
                                Optional. Verification and password-reset emails for this project will target this frontend.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Allowed origins</Label>
                            <textarea
                                {...editProjectForm.register('allowed_origins_text')}
                                rows={4}
                                placeholder={`https://preview.example.com\nhttp://localhost:3000`}
                                className={textareaClassName}
                            />
                            {editProjectForm.formState.errors.allowed_origins_text ? (
                                <p className="text-xs text-rose-300">{editProjectForm.formState.errors.allowed_origins_text.message}</p>
                            ) : null}
                            <p className="text-xs text-[#71717a]">
                                Optional. One origin per line. Live app keys are limited to these origins plus the app frontend URL.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Allow public sign-up</p>
                                <p className="text-xs text-[#71717a]">Use this when the project should accept app registrations.</p>
                            </div>
                            <Toggle
                                checked={editProjectForm.watch('allow_signup')}
                                onChange={() =>
                                    editProjectForm.setValue('allow_signup', !editProjectForm.watch('allow_signup'), {
                                        shouldDirty: true,
                                    })
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingProject(null)}
                                className="border-[#27272a] bg-transparent text-white hover:bg-[#18181b]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateProjectMutation.isPending}
                                className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                            >
                                {updateProjectMutation.isPending ? 'Saving...' : 'Save project'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Delete project"
                description={`Delete ${deleteTarget?.name || 'this project'}? API keys scoped to it will stop working immediately.`}
                confirmLabel="Delete project"
                onConfirm={() => deleteProjectMutation.mutate(deleteTarget.id)}
                isLoading={deleteProjectMutation.isPending}
            />
        </div>
    );
}
