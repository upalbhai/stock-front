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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <Dialog.Content
            className={cn(
              "relative flex w-[calc(100%-1.5rem)] max-h-[min(90dvh,920px)] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft animate-rise outline-none sm:w-full",
              sizeMap[size],
              className
            )}
          >
            {(title || description) && (
              <div className="shrink-0 border-b border-border/60 px-5 py-4 pr-12 sm:px-6 sm:py-5">
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
              {children}
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-xl p-1.5 text-muted hover:bg-border/50 hover:text-text transition sm:right-4 sm:top-4"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
