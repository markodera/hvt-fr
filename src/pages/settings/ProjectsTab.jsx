import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import { createProject, deleteProject, listProjects, updateProject } from '@/api/organizations';
import { createProjectSchema } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ProjectsTab() {
    const queryClient = useQueryClient();
    const [editingProject, setEditingProject] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data: projectsData, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: listProjects,
    });
    
    const projects = projectsData?.results ?? projectsData ?? [];

    const createForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: '', slug: '', allow_signup: false },
    });

    const editForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: '', slug: '', allow_signup: false },
    });

    const createMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            toast.success('Project created successfully');
            createForm.reset();
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateProject,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            toast.success('Project updated successfully');
            setEditingProject(null);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            toast.success('Project deleted successfully');
            setDeleteTarget(null);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const onCreateSubmit = (data) => createMutation.mutate(data);
    const onEditSubmit = (data) => updateMutation.mutate({ id: editingProject.id, data });

    const openEdit = (project) => {
        setEditingProject(project);
        editForm.reset({
            name: project.name,
            slug: project.slug,
            allow_signup: project.allow_signup,
        });
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    return (
        <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a] mb-2">Project Boundaries</p>
            <p className="text-sm text-[#a1a1aa] mb-6">Projects define the boundary for API keys, app auth, and providers.</p>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#18181b] mb-8">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-[#27272a] bg-[#111111]">
                            <th className="px-4 py-3 font-semibold text-[#a1a1aa]">Name</th>
                            <th className="px-4 py-3 font-semibold text-[#a1a1aa]">Slug</th>
                            <th className="px-4 py-3 font-semibold text-[#a1a1aa]">Status</th>
                            <th className="px-4 py-3 font-semibold text-[#a1a1aa] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-[#71717a]">
                                    No projects found.
                                </td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id} className="border-b border-[#27272a] last:border-0 hover:bg-[#27272a]/30 transition-colors">
                                    <td className="px-4 py-3 text-white">{project.name}</td>
                                    <td className="px-4 py-3 text-[#71717a]">{project.slug}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${project.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${project.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {project.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(project)}
                                                className="p-1.5 text-[#71717a] hover:text-white transition-colors"
                                                title="Edit project"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(project)}
                                                className="p-1.5 text-[#71717a] hover:text-red-500 transition-colors"
                                                title="Delete project"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create inline */}
            <div className="rounded-xl border border-[#27272a] bg-[#111111] p-6">
                <h3 className="text-base font-medium text-white mb-4">Create a new project</h3>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="create_name" className="text-white mb-2 block">Project name</Label>
                            <Input
                                id="create_name"
                                {...createForm.register('name')}
                                className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full"
                            />
                            {createForm.formState.errors.name && (
                                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="create_slug" className="text-white mb-2 block">Project slug</Label>
                            <Input
                                id="create_slug"
                                {...createForm.register('slug')}
                                className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full"
                            />
                            {createForm.formState.errors.slug && (
                                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.slug.message}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                        <Controller
                            name="allow_signup"
                            control={createForm.control}
                            render={({ field }) => (
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={field.value}
                                    onClick={() => field.onChange(!field.value)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] ${
                                        field.value ? 'bg-[#7c3aed]' : 'bg-[#18181b] border border-[#27272a]'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            field.value ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            )}
                        />
                        <Label className="text-sm text-[#a1a1aa] cursor-pointer" onClick={() => createForm.setValue('allow_signup', !createForm.getValues('allow_signup'))}>
                            Allow public sign-up for this project
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 h-10 font-medium w-full sm:w-auto mt-2"
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create project'}
                    </Button>
                </form>
            </div>

            {/* Modals */}
            <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
                <DialogContent className="bg-[#18181b] border-[#27272a] text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription className="text-[#a1a1aa]">
                            Update project details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="edit_name" className="text-white mb-2 block">Name</Label>
                            <Input
                                id="edit_name"
                                {...editForm.register('name')}
                                className="bg-[#111111] border-[#27272a] text-white h-10 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]"
                            />
                            {editForm.formState.errors.name && (
                                <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="edit_slug" className="text-[#a1a1aa] mb-2 block">Slug</Label>
                            <Input
                                id="edit_slug"
                                {...editForm.register('slug')}
                                disabled
                                className="bg-[#111111] border-[#27272a] text-[#71717a] h-10 cursor-not-allowed"
                            />
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <Controller
                                name="allow_signup"
                                control={editForm.control}
                                render={({ field }) => (
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={field.value}
                                        onClick={() => field.onChange(!field.value)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                            field.value ? 'bg-[#7c3aed]' : 'bg-[#111111] border border-[#27272a]'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                )}
                            />
                            <Label className="text-sm text-white">Allow sign-ups</Label>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setEditingProject(null)} className="h-10 border-[#27272a] text-white hover:bg-[#27272a]">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white h-10">
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
                title="Delete Project"
                description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
                confirmText="Delete Project"
                isDestructive
                isLoading={deleteMutation.isPending}
            />
        </section>
    );
}
