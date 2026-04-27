import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Registers an Axios response interceptor that redirects to /login on 401.
 * Must be called inside the React Router tree (uses useNavigate internally).
 * Call this once inside AppRoutes so it has access to the router context.
 */
export function useAxiosInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 401
        ) {
          navigate('/login', { replace: true });
        }
        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when the component unmounts
    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);
}
