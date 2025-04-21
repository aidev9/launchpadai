import Cookies from "js-cookie";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";

const ACCESS_TOKEN = "thisisjustarandomstring";

interface AuthUser {
  accountNo: string;
  email: string;
  role: string[];
  exp: number;
}

// Define action types to avoid using 'any'
type AuthAction =
  | { type: "SET_USER"; payload: AuthUser | null }
  | { type: "SET_ACCESS_TOKEN"; payload: string }
  | { type: "RESET_ACCESS_TOKEN" }
  | { type: "RESET" };

// Base atoms
const userAtom = atom<AuthUser | null>(null);
const accessTokenAtom = atomWithStorage<string>(ACCESS_TOKEN, "");

// Derived atoms with actions
export const authAtom = atom(
  // Getter
  (get) => ({
    user: get(userAtom),
    accessToken: get(accessTokenAtom),
  }),
  // Setter
  (get, set, action: AuthAction) => {
    switch (action.type) {
      case "SET_USER":
        set(userAtom, action.payload);
        break;
      case "SET_ACCESS_TOKEN":
        Cookies.set(ACCESS_TOKEN, JSON.stringify(action.payload));
        set(accessTokenAtom, action.payload);
        break;
      case "RESET_ACCESS_TOKEN":
        Cookies.remove(ACCESS_TOKEN);
        set(accessTokenAtom, "");
        break;
      case "RESET":
        Cookies.remove(ACCESS_TOKEN);
        set(userAtom, null);
        set(accessTokenAtom, "");
        break;
      default:
        break;
    }
  }
);

// Action creators with explicit return types
export const authActions = {
  setUser: (user: AuthUser | null): AuthAction => ({
    type: "SET_USER",
    payload: user,
  }),
  setAccessToken: (token: string): AuthAction => ({
    type: "SET_ACCESS_TOKEN",
    payload: token,
  }),
  resetAccessToken: (): AuthAction => ({
    type: "RESET_ACCESS_TOKEN",
  }),
  reset: (): AuthAction => ({
    type: "RESET",
  }),
};

// Custom hook for using auth in components
export function useAuth() {
  const [auth, dispatch] = useAtom(authAtom);

  return {
    ...auth,
    setUser: (user: AuthUser | null) => dispatch(authActions.setUser(user)),
    setAccessToken: (token: string) =>
      dispatch(authActions.setAccessToken(token)),
    resetAccessToken: () => dispatch(authActions.resetAccessToken()),
    reset: () => dispatch(authActions.reset()),
  };
}

// export const useAuth = () => useAuthStore((state) => state.auth)
