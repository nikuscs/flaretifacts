'use client';

import { cva } from 'class-variance-authority';
import { cn } from 'cn';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import XIcon from '~icons/lucide/x';
import type { VariantProps } from 'class-variance-authority';

const dialogContentVariants = cva(
  'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-[-50%] grid-cols-[minmax(0,1fr)] rounded-(--radius-surface) border bg-(--surface-raised) shadow-(--shadow-floating) duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  {
    variants: {
      variant: {
        default: 'max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto p-6 sm:max-w-lg',
        document: 'max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl',
        illustration: 'max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-[520px]',
        sheet: 'overflow-y-auto max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-none max-sm:translate-0 max-sm:rounded-none max-sm:border-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-3xl',
      },
      mobile: {
        card: '',
        sheet: 'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-none max-sm:translate-0 max-sm:content-start max-sm:overflow-y-auto max-sm:rounded-none max-sm:border-0',
      },
    },
    defaultVariants: { variant: 'default', mobile: 'card' },
  },
);

const dialogTitleVariants = cva('', {
  variants: {
    variant: {
      default: 'text-base font-medium',
      display: 'text-4xl font-normal tracking-tight',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  variant,
  mobile,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & VariantProps<typeof dialogContentVariants> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ variant, mobile }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-2 right-2 grid size-11 place-items-center rounded-(--radius-control) opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground sm:top-4 sm:right-4 sm:size-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, media, children, ...props }: React.ComponentProps<'div'> & { media?: React.ReactNode }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex items-start gap-3 text-left', className)}
      {...props}
    >
      {media}
      <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
    </div>
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title> & VariantProps<typeof dialogTitleVariants>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogTitleVariants({ variant }), className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
