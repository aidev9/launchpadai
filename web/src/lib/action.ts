import { createSafeActionClient } from "next-safe-action";

// Regular action client for non-authenticated actions
export const actionClient = createSafeActionClient();

// Protected action client that requires authentication (to be implemented later)
export const userActionClient = createSafeActionClient();
