'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
};

export function Sheet({ open, onOpenChange, title, description, children, className, showClose = true }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-text/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl bg-surface shadow-sheet safe-bottom',
                  className,
                )}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mx-auto mt-2 mb-4 h-1 w-10 rounded-full bg-divider" aria-hidden />
                <div className="px-6 pb-4">
                  {(title || description) && (
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        {title && (
                          <Dialog.Title className="text-[20px] font-semibold tracking-tight text-text">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="mt-1 text-[14px] text-muted">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      {showClose && (
                        <Dialog.Close asChild>
                          <button
                            aria-label="Close"
                            className="haptic-press rounded-full p-1.5 text-muted hover:bg-divider/40"
                          >
                            <X size={18} />
                          </button>
                        </Dialog.Close>
                      )}
                    </div>
                  )}
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
