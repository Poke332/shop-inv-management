export const HTTP_ENABLED = import.meta.env.VITE_DATA_SOURCE === 'http'
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')
