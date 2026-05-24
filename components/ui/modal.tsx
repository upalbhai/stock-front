"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
};

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-5xl"
};

export function Modal({ open, onClose, title, description, children, size = "md", className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/55 backdrop-blur-sm animate-fade" />
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Content
              className={cn(
                "w-full rounded-3xl border border-border bg-surface p-6 shadow-soft animate-rise outline-none my-8",
                sizeMap[size], className
              )}
            >
              {(title || description) && (
                <div className="mb-5">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
                  )}
                  {description && (
                    <Dialog.Description className="mt-1 text-sm text-muted">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
              )}
              {children}
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-xl p-1.5 text-muted hover:bg-border/50 hover:text-text transition"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
