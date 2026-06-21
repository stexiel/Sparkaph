// API Configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_URL = API_BASE;
export const APPS_PORT = 3000; // Apps served through backend
export const APPS_URL = API_BASE;

// WebSocket Configuration
const WS_BASE = import.meta.env.VITE_WS_URL || API_BASE;
export const WS_URL = WS_BASE;

// OAuth Configuration
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liqEgGVQuMMBoEMs';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '328516047497-0m50pk1qc6kjce3gi7a4u5h61spta142.apps.googleusercontent.com';
export const OAUTH_REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI || 'http://localhost:5173';
