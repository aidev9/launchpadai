"use server";

import { adminAuth } from "@/lib/firebase/admin";

export async function revokeUserTokens(uid: string) {
  if (!uid) {
    throw new Error("User ID is required");
  }

  try {
    await adminAuth.revokeRefreshTokens(uid);
    return { success: true };
  } catch (error: any) {
    console.error("Error revoking tokens:", error);
    throw new Error(error.message);
  }
}
