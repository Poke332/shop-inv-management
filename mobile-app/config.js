// Central place that exposes the API base URL.
// Every screen imports from here instead of reading process.env directly.
const rawUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.3.6.211:3333";

// Strips trailing slashes and trailing /api so callers consistently use `${API_URL}/api/...`
export const API_URL = rawUrl.replace(/\/+$/, "").replace(/\/api$/, "");
