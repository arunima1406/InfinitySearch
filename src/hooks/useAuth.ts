import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';

export function useAuth() {
  const { isSignedIn, signOut, isLoaded } = useClerkAuth();
  const { user } = useUser();

  return {
    isSignedIn,
    user,
    signOut,
    isLoaded,
  };
}
