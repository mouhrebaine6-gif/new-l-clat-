const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";

export const hasBackend = (): boolean => API_BASE.length > 0;
