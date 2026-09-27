import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5085/api';

let getAccessToken = () => null;
let getSessionGeneration = () => 0;
let onUnauthorized = () => {};

export const configureAuth = (callbacks) => {
    getAccessToken = callbacks.getAccessToken;
    getSessionGeneration = callbacks.getSessionGeneration;
    onUnauthorized = callbacks.onUnauthorized;
};

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Capture the token and in-memory session that actually sent this request.
api.interceptors.request.use(
    (config) => {
        const authRequest = config._authSession || {
            token: getAccessToken(),
            generation: getSessionGeneration(),
        };
        delete config._authSession;
        config._authRequest = authRequest;
        const { token } = authRequest;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const authRequest = error.config?._authRequest;

        // Avoid retaining the JWT in an Axios error a caller might log.
        if (error.config) {
            delete error.config._authRequest;
            if (error.config.headers) {
                error.config.headers.delete?.('Authorization');
                delete error.config.headers.Authorization;
            }
        }

        if (
            error.response?.status === 401 &&
            error.response?.data?.code === 'AUTH_SESSION_INVALID' &&
            authRequest?.token &&
            authRequest.token === getAccessToken() &&
            authRequest.generation === getSessionGeneration()
        ) {
            onUnauthorized(authRequest);
        }
        return Promise.reject(error);
    }
);

export default api;
