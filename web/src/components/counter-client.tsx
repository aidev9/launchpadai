"use client";

import { useAtom } from "jotai";
import { atom } from "jotai";
import { Button } from "@/components/ui/button";
import { countAtom, incrementCountAtom } from "@/lib/store";

// Move the atom definition outside the component to prevent recreation on each render
const decrementAtom = atom(
  (get) => get(countAtom),
  (_get, set) => set(countAtom, (prev) => prev - 1)
);

export default function CounterClient() {
  const [count] = useAtom(countAtom);
  const [, increment] = useAtom(incrementCountAtom);
  const [, decrement] = useAtom(decrementAtom);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl font-bold">{count}</div>
      <div className="flex gap-4">
        <Button
          onClick={decrement}
          variant="outline"
          aria-label="Decrement count"
        >
          -
        </Button>
        <Button
          onClick={increment}
          variant="default"
          aria-label="Increment count"
        >
          +
        </Button>
      </div>
    </div>
  );
}
