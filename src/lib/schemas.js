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
});

// User role schema

export const updateRoleSchema = z.object({
    role: z.enum(['owner', 'admin', 'member']),
});