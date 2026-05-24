"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl"
};

export function Drawer({ open, onClose, title, description, children, size = "md", className }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/55 backdrop-blur-sm animate-fade" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex flex-col h-full w-full bg-surface border-l border-border shadow-soft animate-slide-in outline-none",
            sizeMap[size],
            className
          )}
        >
          {/* Header */}
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                {title && <Dialog.Title className="text-lg font-bold text-text">{title}</Dialog.Title>}
                {description && <Dialog.Description className="text-xs text-muted mt-1">{description}</Dialog.Description>}
              </div>
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-muted hover:bg-border/50 hover:text-text transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body and content container */}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
