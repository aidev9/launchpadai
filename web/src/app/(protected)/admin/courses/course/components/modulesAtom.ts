import { atom } from "jotai";
import { Module } from "@/lib/firebase/schema";

// Create an atom for the modules
export const modulesAtom = atom<Module[]>([]);
