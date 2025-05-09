import { atom } from "jotai";
import { FirestoreAsset } from "@/lib/firebase/schema";

// Create an atom to share all assets
export const allAssetsAtom = atom<FirestoreAsset[]>([]);

// Create an atom to store the selected phases for assets
export const selectedAssetPhasesAtom = atom<string[]>(["All"]);
