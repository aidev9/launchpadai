import React from "react";
import { cn } from "@/lib/utils";

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  fullWidth?: boolean;
  ref?: React.Ref<HTMLElement>;
}

export const Main = ({ fixed, fullWidth, ...props }: MainProps) => {
  return (
    <main
      className={cn(
        "peer-[.header-fixed]/header:mt-16",
        !fullWidth && "px-4 py-6",
        fullWidth && "p-6",
        fixed && "fixed-main flex flex-grow flex-col overflow-hidden"
      )}
      {...props}
    />
  );
};

Main.displayName = "Main";
