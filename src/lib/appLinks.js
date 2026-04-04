export const SITE_URL = 'https://hvts.app';
export const API_URL = 'https://api.hvts.app';
export const GITHUB_URL = 'https://github.com/markodera/hvt';
export const DOCS_URL = import.meta.env.VITE_PUBLIC_DOCS_URL?.trim() || 'https://docs.hvts.app';
export const CHANGELOG_URL = `${GITHUB_URL}/commits/main`;
export const STATUS_URL = import.meta.env.VITE_PUBLIC_STATUS_URL?.trim() || `${API_URL}/healthz/`;
