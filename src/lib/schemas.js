import { z } from 'zod';

const redirectUrisTextSchema = z
    .string()
    .min(1, 'Add at least one redirect URI')
    .refine((value) => {
        const lines = value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        return lines.length > 0 && lines.every((line) => z.string().url().safeParse(line).success);
    }, 'Enter one valid redirect URI per line');

const appAccessSlugPattern = /^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/;

const optionalProjectIdSchema = z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) {
        return null;
    }
    return value;
}, z.string().uuid('Select a valid project').nullable().optional());

const appAccessSlugSchema = z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(appAccessSlugPattern, 'Use lowercase letters, numbers, and separators like ., _, :, or -');

const optionalDescriptionSchema = z.string().max(1000, 'Description is too long').optional();
const optionalFrontendUrlSchema = z.preprocess((value) => {
    if (typeof value !== 'string') {
        return value;
    }

    const normalized = value.trim();
    return normalized === '' ? '' : normalized;
}, z.union([z.literal(''), z.string().url('Enter a valid frontend URL')]));

// Auth schemas

export const loginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: z.string().email('Enter a valid email'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    password1: z.string().min(8, 'Password must be at least 8 characters'),
    password2: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password1 === data.password2, {
    message: 'Passwords do not match',
    path: ['password2'],
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
    new_password1: z.string().min(8, 'Password must be at least 8 characters'),
    new_password2: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.new_password1 === data.new_password2, {
    message: 'Passwords do not match',
    path: ['new_password2'],
});

export const changePasswordSchema = z.object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password1: z.string().min(8, 'Password must be at least 8 characters'),
    new_password2: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.new_password1 === data.new_password2, {
    message: 'Passwords do not match',
    path: ['new_password2'],
});

export const profileSchema = z.object({
    first_name: z.string().max(100, 'First name is too long'),
    last_name: z.string().max(100, 'Last name is too long'),
});

// API key schemas

export const createKeySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    environment: z.enum(['test', 'live']),
    project_id: z.string().uuid('Select a project'),
    scopes: z.array(z.string()).min(1, 'Select at least one scope'),
    expires_at: z.string().nullable().optional(),
});

// Webhook schemas

export const createWebhookSchema = z.object({
    url: z.string().url('Enter a valid URL'),
    events: z.array(z.string()).min(1, 'Select at least one event'),
    description: z.string().optional(),
});

export const updateWebhookSchema = z.object({
    url: z.string().url('Enter a valid URL'),
    events: z.array(z.string()).min(1, 'Select at least one event'),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
});

// Organisation schemas

export const orgSettingsSchema = z.object({
    name: z.string().min(1, 'Organisation name is required').max(100),
    slug: z.string().min(1, 'Slug is required').max(50).regex(
        /^[a-z0-9-]+$/,
        'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
    allow_signup: z.boolean(),
});

export const createOrgSchema = z.object({
    name: z.string().min(1, 'Organisation name is required').max(100),
    slug: z.string().min(1, 'Slug is required').max(50).regex(
        /^[a-z0-9-]+$/,
        'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
    allow_signup: z.boolean(),
});

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100),
    slug: z.string().min(1, 'Slug is required').max(50).regex(
        /^[a-z0-9-]+$/,
        'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
    allow_signup: z.boolean(),
    frontend_url: optionalFrontendUrlSchema,
});

export const projectPermissionSchema = z.object({
    slug: appAccessSlugSchema,
    name: z.string().min(1, 'Permission name is required').max(120, 'Permission name is too long'),
    description: optionalDescriptionSchema,
});

export const projectRoleSchema = z.object({
    slug: appAccessSlugSchema,
    name: z.string().min(1, 'Role name is required').max(120, 'Role name is too long'),
    description: optionalDescriptionSchema,
    is_default_signup: z.boolean(),
    permission_ids: z.array(z.string().uuid()).default([]),
});

export const projectUserRoleAssignmentSchema = z.object({
    role_ids: z.array(z.string().uuid()).default([]),
});

export const socialProviderCreateSchema = z.object({
    provider: z.enum(['google', 'github']),
    client_id: z.string().min(1, 'Client ID is required').max(255),
    client_secret: z.string().min(1, 'Client secret is required').max(255),
    redirect_uris_text: redirectUrisTextSchema,
    is_active: z.boolean(),
});

export const socialProviderUpdateSchema = z.object({
    client_id: z.string().min(1, 'Client ID is required').max(255),
    client_secret: z.string().max(255).optional(),
    redirect_uris_text: redirectUrisTextSchema,
    is_active: z.boolean(),
});

export const organizationInvitationCreateSchema = z.object({
    email: z.string().email('Enter a valid email'),
    role: z.enum(['admin', 'member']),
    project_id: optionalProjectIdSchema,
    app_role_ids: z.array(z.string().uuid()).default([]),
}).superRefine((data, ctx) => {
    if (data.app_role_ids.length > 0 && !data.project_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['project_id'],
            message: 'Select a project before assigning app roles',
        });
    }
});

// User role schema

export const updateRoleSchema = z.object({
    role: z.enum(['owner', 'admin', 'member']),
});
