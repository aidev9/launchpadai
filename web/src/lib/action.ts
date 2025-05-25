import { createSafeActionClient } from "next-safe-action";
import { getUser } from "@/lib/firebase/actions/auth";
import { redirect } from "next/navigation";

// Regular action client for non-authenticated actions
export const actionClient = createSafeActionClient();

// Protected action client that requires authentication
export const userActionClient = createSafeActionClient().use(
  async ({ next, ctx }) => {
    const user = await getUser();
    if (!user) redirect("/auth/signin");
    return next({ ctx: { user } });
  }
);
