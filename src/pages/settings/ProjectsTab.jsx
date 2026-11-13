import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';

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
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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
            setIsCreateOpen(false);
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
                        <tr className="border-b border-[#27272a] text-[#71717a]">
                            <th className="py-3 px-4 font-medium">Name</th>
                            <th className="py-3 px-4 font-medium">Slug</th>
                            <th className="py-3 px-4 font-medium">Public Sign-up</th>
                            <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-6 text-center text-[#71717a]">
                                    No projects found. Create one below.
                                </td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id} className="text-white">
                                    <td className="py-3 px-4 font-medium">{project.name}</td>
                                    <td className="py-3 px-4 text-[#a1a1aa] font-mono text-xs">{project.slug}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            project.allow_signup 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-[#27272a] text-[#a1a1aa]'
                                        }`}>
                                            {project.allow_signup ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
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

            {/* Collapsible Create Project Section */}
            <div className="rounded-xl border border-[#27272a] bg-[#111111] overflow-hidden transition-all">
                <div 
                    onClick={() => setIsCreateOpen(!isCreateOpen)}
                    className="flex cursor-pointer items-center justify-between p-5 hover:bg-[#161619] transition"
                >
                    <div>
                        <h3 className="text-base font-medium text-white">Create a new project</h3>
                        <p className="text-xs text-[#a1a1aa] mt-0.5">Use a separate project for each application or environment.</p>
                    </div>
                    <Button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCreateOpen(!isCreateOpen);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                            isCreateOpen
                                ? 'border border-[#27272a] bg-[#18181b] text-zinc-300 hover:text-white'
                                : 'bg-[#7c3aed] text-white shadow-sm shadow-[#7c3aed]/25 hover:bg-[#6d28d9]'
                        }`}
                    >
                        {isCreateOpen ? (
                            <>
                                <ChevronUp className="h-4 w-4" />
                                <span>Collapse</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                <span>+ New project</span>
                            </>
                        )}
                    </Button>
                </div>

                {isCreateOpen && (
                    <div className="p-6 border-t border-[#27272a] bg-[#141416]/50">
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="create_name" className="text-white mb-2 block">Project name</Label>
                                    <Input
                                        id="create_name"
                                        placeholder="e.g. Production Web App"
                                        {...createForm.register('name')}
                                        className="bg-[#18181b] border-[#27272a] text-white focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 h-10 w-full"
                                    />
                                    {createForm.formState.errors.name && (
                                        <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="create_slug" className="text-white mb-2 block">Project slug</Label>
                                    <Input
                                        id="create_slug"
                                        placeholder="e.g. production-web-app"
                                        {...createForm.register('slug')}
                                        className="bg-[#18181b] border-[#27272a] text-white focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 h-10 w-full"
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
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                                                field.value ? 'bg-[#7c3aed]' : 'bg-[#18181b] border border-[#27272a]'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full ring-0 transition duration-200 ease-in-out ${
                                                    field.value ? 'translate-x-6 bg-white shadow-md' : 'translate-x-1 bg-zinc-400'
                                                }`}
                                            />
                                        </button>
                                    )}
                                />
                                <Label className="text-sm text-[#a1a1aa] cursor-pointer" onClick={() => createForm.setValue('allow_signup', !createForm.getValues('allow_signup'))}>
                                    Allow public sign-up for this project
                                </Label>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] px-6 h-10 w-full sm:w-auto shadow-sm shadow-[#7c3aed]/25"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create project'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="border-[#27272a] bg-[#18181b] text-zinc-300 hover:text-white px-5 h-10"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
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
                                className="bg-[#111111] border-[#27272a] text-white h-10 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                                            field.value ? 'bg-[#7c3aed]' : 'bg-[#111111] border border-[#27272a]'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full ring-0 transition duration-200 ease-in-out ${
                                                field.value ? 'translate-x-6 bg-white shadow-md' : 'translate-x-1 bg-zinc-400'
                                            }`}
                                        />
                                    </button>
                                )}
                            />
                            <Label className="text-sm text-[#a1a1aa] cursor-pointer" onClick={() => editForm.setValue('allow_signup', !editForm.getValues('allow_signup'))}>
                                Allow public sign-up
                            </Label>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingProject(null)}
                                className="border-[#27272a] text-zinc-300 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/25"
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Project"
                description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone and will delete all associated API keys.`}
                confirmText="Delete project"
                variant="destructive"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
            />
        </section>
    );
}
