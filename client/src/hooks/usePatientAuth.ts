import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function usePatientAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/patient/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPatient: user?.role === 'patient',
    error,
  };
}