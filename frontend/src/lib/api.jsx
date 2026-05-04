import axios from 'axios';

// Use environment variable when provided (set in Next.js as NEXT_PUBLIC_API_URL),
// otherwise fall back to the backend port used by the project (5500).
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        // ignore (SSR or storage unavailable)
    }
    return config;
});

export default api;
