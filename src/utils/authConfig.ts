
// Clerk configuration
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
};

export const isClerkConfigured = () => {
  return CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== '';
};
