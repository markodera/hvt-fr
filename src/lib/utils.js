import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString, options = {}) {
    if (!dateString) return '-';
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

export function formatRelativeTime(dateString) {
    if (!dateString) return '-';
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

export function truncate(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
}

function formatThrottledMessage(detail) {
    if (!detail || typeof detail !== 'object') {
        return '';
    }

    const message = typeof detail.message === 'string' ? detail.message.trim() : '';
    if (!message) {
        return '';
    }

    const retryAfter = typeof detail.retry_after_human === 'string' ? detail.retry_after_human.trim() : '';
    if (!retryAfter || message.toLowerCase().includes(retryAfter.toLowerCase())) {
        return message;
    }

    return `${message} Try again in ${retryAfter}.`;
}

export function getErrorMessage(error) {
    if (!error) {
        return 'Something went wrong';
    }

    if (typeof error.message === 'string' && error.message.trim()) {
        if (typeof error.detail === 'string') {
            return error.detail;
        }

        if (typeof error.detail === 'object' && error.detail !== null) {
            const throttledMessage = formatThrottledMessage(error.detail);
            if (throttledMessage) {
                return throttledMessage;
            }

            const values = Object.values(error.detail);
            if (values.length > 0) {
                const firstError = values[0];
                return Array.isArray(firstError) ? firstError[0] : String(firstError);
            }
        }
    }

    if (!error?.response?.data) {
        return error?.message || 'Something went wrong';
    }

    const data = error.response.data;

    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;

    if (typeof data.detail === 'object' && data.detail !== null) {
        const throttledMessage = formatThrottledMessage(data.detail);
        if (throttledMessage) {
            return throttledMessage;
        }

        const values = Object.values(data.detail);
        if (values.length > 0) {
            const firstError = values[0];
            return Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
    }

    if (typeof data === 'object' && data !== null) {
        const throttledMessage = formatThrottledMessage(data);
        if (throttledMessage) {
            return throttledMessage;
        }

        const keys = Object.keys(data).filter((key) => !['status', 'code', 'error'].includes(key));
        if (keys.length > 0) {
            const firstError = data[keys[0]];
            return Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
    }

    return 'An unexpected error occurred';
}
