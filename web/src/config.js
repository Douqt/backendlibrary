// API Configuration
// Uses VITE_API_URL from .env.local for local development
// Falls back to production URL if not set
export const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://librarydb.duckdns.org'}/api`;
