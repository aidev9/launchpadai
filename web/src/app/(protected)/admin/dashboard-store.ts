import { atom } from "jotai";
import { User } from "./types/dashboard";

// Store for the selected user from the dashboard
export const selectedDashboardUserAtom = atom<User | null>(null);

// Store for the refresh state
export const dashboardRefreshTriggerAtom = atom<number>(0);
