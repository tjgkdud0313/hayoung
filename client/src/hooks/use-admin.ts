import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface AdminStatus {
  isAdmin: boolean;
}

export function useAdmin() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading: adminLoading } = useQuery<AdminStatus>({
    queryKey: ["/api/auth/admin-status"],
    queryFn: async () => {
      const response = await fetch("/api/auth/admin-status", {
        credentials: "include",
      });
      if (!response.ok) {
        return { isAdmin: false };
      }
      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    isAdmin: data?.isAdmin || false,
    isLoading: authLoading || adminLoading,
  };
}
