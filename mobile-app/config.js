// Central place that exposes the API base URL (including the /api prefix).
// Every screen imports from here instead of reading process.env directly, so
// there is a single documented source of truth for where the API lives.
// Falls back to the local dev server when EXPO_PUBLIC_API_URL is not set.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

