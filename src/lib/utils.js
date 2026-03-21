import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 * @param  {...(string|undefined|null|false)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format ISO date string to human-readable format
 * @param {string} dateString - ISO 8601 date string
 * @param {object} [options] - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(dateString, options = {}) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    }).format(date);
}

/**
 * Format relative time (e.g. "2 hours ago")
 * @param {string} dateString
 * @returns {string}
 */
export function formatRelativeTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString, { hour: undefined, minute: undefined });
}

/**
 * Truncate a string to a maximum length
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '…';
}

/**
 * Extract error message from API error response
 * @param {Error} error
 * @returns {string}
 */
export function getErrorMessage(error) {
    if (!error?.response?.data) {
        return error?.message || 'Something went wrong';
    }

    const data = error.response.data;

    // Handle string details
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;

    // Handle DRF nested validation errors under "detail" (e.g. { detail: { non_field_errors: [...] } })
    if (typeof data.detail === 'object' && data.detail !== null) {
        const values = Object.values(data.detail);
        if (values.length > 0) {
            const firstError = values[0];
            return Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
    }

    // Handle root-level DRF validation errors (e.g. { email: ["This field is required."] })
    if (typeof data === 'object' && data !== null) {
        // Skip over generic status/code keys sometimes added by custom middleware
        const keys = Object.keys(data).filter(k => k !== 'status' && k !== 'code' && k !== 'error');
        if (keys.length > 0) {
            const firstError = data[keys[0]];
            return Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
    }

    return 'An unexpected error occurred';
}
