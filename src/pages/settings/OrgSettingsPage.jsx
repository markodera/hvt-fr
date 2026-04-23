import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, Pencil, Shield, Trash2, UserRound } from 'lucide-react';
import { getCurrentOrg, updateOrg, listProjects, createProject, updateProject, deleteProject } from '@/api/organizations';
import { updateProfile, changePassword } from '@/api/auth';
import { orgSettingsSchema, createProjectSchema, profileSchema, changePasswordSchema } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { PermissionDenied } from '@/components/PermissionDenied';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProjectSocialProvidersSection } from './ProjectSocialProvidersSection';
import { getErrorMessage } from '@/lib/utils';

export function OrgSettingsPage() {
    const queryClient = useQueryClient();
    const { user, refreshSession } = useAuth();
    const [editingProject, setEditingProject] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data: org, isLoading: orgLoading } = useQuery({
        queryKey: ['organization'],
        queryFn: getCurrentOrg,
    });

    const { data: projectData, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: listProjects,
    });

    const projects = projectData?.results ?? projectData ?? [];

    const orgForm = useForm({
        resolver: zodResolver(orgSettingsSchema),
        defaultValues: {
            name: '',
            slug: '',
            allow_signup: false,
        },
    });

    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
        },
    });

    const passwordForm = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            old_password: '',
            new_password1: '',
            new_password2: '',
        },
    });

    const projectForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            slug: '',
            allow_signup: false,
        },
    });

    const editProjectForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            slug: '',
            allow_signup: false,
        },
    });

    useEffect(() => {
        if (org) {
            orgForm.reset({
                name: org.name,
                slug: org.slug,
                allow_signup: org.allow_signup,
            });
            projectForm.reset({
                name: '',
                slug: '',
                allow_signup: org.allow_signup,
            });
        }
    }, [org, orgForm, projectForm]);

    useEffect(() => {
        if (user) {
            profileForm.reset({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
            });
        }
    }, [user, profileForm]);

    useEffect(() => {
        if (editingProject) {
            editProjectForm.reset({
                name: editingProject.name,
                slug: editingProject.slug,
                allow_signup: editingProject.allow_signup,
            });
        }
    }, [editingProject, editProjectForm]);

    const invalidateProjectQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    };

    const orgMutation = useMutation({
        mutationFn: updateOrg,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization'] });
            invalidateProjectQueries();
            toast.success('Organisation settings updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async () => {
            await refreshSession();
            toast.success('Profile updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const passwordMutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            passwordForm.reset();
            toast.success('Password updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const projectMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            invalidateProjectQueries();
            projectForm.reset({
                name: '',
                slug: '',
                allow_signup: org?.allow_signup ?? false,
            });
            toast.success('Project created');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const updateProjectMutation = useMutation({
        mutationFn: ({ id, data }) => updateProject(id, data),
        onSuccess: () => {
            invalidateProjectQueries();
            setEditingProject(null);
            toast.success('Project updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteProjectMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            invalidateProjectQueries();
            setDeleteTarget(null);
            toast.success('Project deleted');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    // Check if user has permission to access org settings (owner only)
    // Project-scoped users can access their project settings separately
    if (!user || (!user.is_project_scoped && user.role !== 'owner')) {
        return <PermissionDenied featureName="Organization Settings" />;
    }

    if (orgLoading || !user) {
        return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    }

    const allowSignup = orgForm.watch('allow_signup');
    const projectAllowSignup = projectForm.watch('allow_signup');
    const editProjectAllowSignup = editProjectForm.watch('allow_signup');

    return (
        <div className="max-w-4xl space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-bg-secondary border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <UserRound className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-text-primary">Profile</h2>
                    </div>

                    <form onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="profile-email">Email</Label>
                            <Input id="profile-email" value={user.email || ''} disabled />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="profile-first-name">First name</Label>
                                <Input id="profile-first-name" {...profileForm.register('first_name')} />
                                {profileForm.formState.errors.first_name && <p className="text-xs text-danger">{profileForm.formState.errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-last-name">Last name</Label>
                                <Input id="profile-last-name" {...profileForm.register('last_name')} />
                                {profileForm.formState.errors.last_name && <p className="text-xs text-danger">{profileForm.formState.errors.last_name.message}</p>}
                            </div>
                        </div>

                        <Button type="submit" disabled={!profileForm.formState.isDirty || profileMutation.isPending}>
                            {profileMutation.isPending ? 'Saving...' : 'Save profile'}
                        </Button>
                    </form>
                </div>

                <div className="bg-bg-secondary border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-text-primary">Security</h2>
                    </div>

                    <form onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="old_password">Current password</Label>
                            <Input id="old_password" type="password" {...passwordForm.register('old_password')} />
                            {passwordForm.formState.errors.old_password && <p className="text-xs text-danger">{passwordForm.formState.errors.old_password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new_password1">New password</Label>
                            <Input id="new_password1" type="password" {...passwordForm.register('new_password1')} />
                            {passwordForm.formState.errors.new_password1 && <p className="text-xs text-danger">{passwordForm.formState.errors.new_password1.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new_password2">Confirm new password</Label>
                            <Input id="new_password2" type="password" {...passwordForm.register('new_password2')} />
                            {passwordForm.formState.errors.new_password2 && <p className="text-xs text-danger">{passwordForm.formState.errors.new_password2.message}</p>}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs text-text-secondary">Need an email reset flow instead? Use the public forgot-password page.</p>
                            <Button type="submit" disabled={passwordMutation.isPending || passwordForm.formState.isSubmitting}>
                                {passwordMutation.isPending ? 'Updating...' : 'Change password'}
                            </Button>
                        </div>
                        <Link to="/forgot-password" className="inline-flex text-sm text-primary hover:text-primary-hover transition-colors">
                            Open forgot password
                        </Link>
                    </form>
                </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-text-primary">Organisation Settings</h2>
                </div>

                <form onSubmit={orgForm.handleSubmit((data) => orgMutation.mutate(data))} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organisation name</Label>
                        <Input id="org-name" {...orgForm.register('name')} />
                        {orgForm.formState.errors.name && <p className="text-xs text-danger">{orgForm.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="org-slug">Slug</Label>
                        <Input id="org-slug" {...orgForm.register('slug')} />
                        {orgForm.formState.errors.slug && <p className="text-xs text-danger">{orgForm.formState.errors.slug.message}</p>}
                        <p className="text-xs text-text-muted">Used in URLs. Lowercase letters, numbers, and hyphens only.</p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-border">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Allow public sign-up</p>
                            <p className="text-xs text-text-secondary">New default-project keys inherit this setting.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={allowSignup}
                            onClick={() => orgForm.setValue('allow_signup', !allowSignup, { shouldDirty: true })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowSignup ? 'bg-primary' : 'bg-bg-tertiary border border-border'}`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${allowSignup ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <Button type="submit" disabled={!orgForm.formState.isDirty || orgMutation.isPending}>
                        {orgMutation.isPending ? 'Saving...' : 'Save organisation'}
                    </Button>
                </form>
            </div>

            <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Projects</h2>
                        <p className="text-sm text-text-secondary">Projects define the app boundary for API keys and app auth.</p>
                    </div>
                    <Badge variant="secondary">{projects.length} total</Badge>
                </div>

                <div className="space-y-3">
                    {projectsLoading && <LoadingSpinner size="sm" />}
                    {!projectsLoading && projects.length === 0 && (
                        <p className="text-sm text-text-secondary">No projects yet. Create one below.</p>
                    )}
                    {projects.map((project) => (
                        <div key={project.id} className="flex flex-col gap-3 rounded-xl border border-border bg-bg-tertiary/40 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-text-primary">{project.name}</p>
                                    {project.is_default && <Badge>Default</Badge>}
                                    <Badge variant={project.is_active ? 'success' : 'danger'}>
                                        {project.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge variant={project.allow_signup ? 'secondary' : 'warning'}>
                                        {project.allow_signup ? 'Signup open' : 'Signup closed'}
                                    </Badge>
                                </div>
                                <p className="mt-1 font-mono text-xs text-text-muted">{project.slug}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditingProject(project)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                {!project.is_default && (
                                    <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(project)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-border pt-6">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-text-primary">Create project</h3>
                        <p className="text-sm text-text-secondary">Use a separate project for each app or environment.</p>
                    </div>

                    <form onSubmit={projectForm.handleSubmit((data) => projectMutation.mutate(data))} className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project name</Label>
                            <Input id="project-name" placeholder="Storefront Prod" {...projectForm.register('name')} />
                            {projectForm.formState.errors.name && <p className="text-xs text-danger">{projectForm.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project-slug">Project slug</Label>
                            <Input id="project-slug" placeholder="storefront-prod" {...projectForm.register('slug')} />
                            {projectForm.formState.errors.slug && <p className="text-xs text-danger">{projectForm.formState.errors.slug.message}</p>}
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-text-primary">Allow public sign-up</p>
                                <p className="text-xs text-text-secondary">Applies to app sign-up when this project key is used.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={projectAllowSignup}
                                onClick={() => projectForm.setValue('allow_signup', !projectAllowSignup, { shouldDirty: true })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${projectAllowSignup ? 'bg-primary' : 'bg-bg-tertiary border border-border'}`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${projectAllowSignup ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" disabled={projectMutation.isPending || projectForm.formState.isSubmitting}>
                                {projectMutation.isPending ? 'Creating...' : 'Create project'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <ProjectSocialProvidersSection projects={projects} />

            <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit project</DialogTitle>
                        <DialogDescription>Update the project name, slug, and signup setting.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editProjectForm.handleSubmit((data) => updateProjectMutation.mutate({ id: editingProject.id, data }))} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-name">Project name</Label>
                            <Input id="edit-project-name" {...editProjectForm.register('name')} />
                            {editProjectForm.formState.errors.name && <p className="text-xs text-danger">{editProjectForm.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-slug">Project slug</Label>
                            <Input id="edit-project-slug" {...editProjectForm.register('slug')} />
                            {editProjectForm.formState.errors.slug && <p className="text-xs text-danger">{editProjectForm.formState.errors.slug.message}</p>}
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-text-primary">Allow public sign-up</p>
                                <p className="text-xs text-text-secondary">Applies when this project key is used for app signup.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={editProjectAllowSignup}
                                onClick={() => editProjectForm.setValue('allow_signup', !editProjectAllowSignup, { shouldDirty: true })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editProjectAllowSignup ? 'bg-primary' : 'bg-bg-tertiary border border-border'}`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${editProjectAllowSignup ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateProjectMutation.isPending || editProjectForm.formState.isSubmitting}>
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
                description={`Are you sure you want to delete "${deleteTarget?.name}"? API keys already assigned to it will stop working until you reissue them.`}
                confirmLabel="Delete project"
                onConfirm={() => deleteProjectMutation.mutate(deleteTarget.id)}
                isLoading={deleteProjectMutation.isPending}
            />
        </div>
    );
}
