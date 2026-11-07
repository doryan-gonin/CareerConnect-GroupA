// Simple variable helper to :
// - Use environment variable in Prod (Vercel)
// - Use localhost for local dev

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
