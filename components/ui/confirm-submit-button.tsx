"use client";

import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  ...props
}: ButtonProps & {
  message: string;
  children: ReactNode;
}) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }

        props.onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
