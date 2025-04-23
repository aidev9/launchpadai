import { atom } from "jotai";

// Atom for selected assets (mapping of asset IDs to boolean selection state)
export const selectedAssetsAtom = atom<Record<string, boolean>>({});
