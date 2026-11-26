'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';
import { MOTION } from '@/constants/motion.constants';
import type { ReactNode } from 'react';

interface FieldControl {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
}

interface FieldProps {
  label: string;
  description?: string;
  error?: string;
  children: (control: FieldControl) => ReactNode;
}

function Field({ label, description, error, children }: FieldProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const message = error ?? description;
  const transition = reduced ? { duration: 0 } : { height: MOTION.spring.smooth, opacity: { duration: MOTION.duration.fast } };

  return (
    <div
      className="grid min-w-0 content-start [&_[data-slot=input]]:h-9 [&_[data-slot=input]]:rounded-(--radius-control) [&_[data-slot=input]]:border-(--border-strong) [&_[data-slot=input]]:bg-card [&_[data-slot=input]]:px-3 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:transition-colors [&_[data-slot=input]]:hover:border-foreground [&_[data-slot=input]]:focus-visible:border-foreground [&_[data-slot=input]]:focus-visible:ring-0 [&_[data-slot=input]]:aria-invalid:border-destructive [&_[data-slot=input]]:aria-invalid:ring-0 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:rounded-(--radius-control) [&_[data-slot=select-trigger]]:border-(--border-strong) [&_[data-slot=select-trigger]]:bg-card [&_[data-slot=select-trigger]]:hover:border-foreground [&_[data-slot=select-trigger]]:hover:bg-card [&_[data-slot=select-trigger]]:focus-visible:border-foreground [&_[data-slot=select-trigger]]:data-[state=open]:border-foreground [&_[data-slot=select-trigger]]:data-[state=open]:bg-card"
      data-slot="field"
    >
      <label className="mb-2 text-sm font-medium" htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? `${id}-message` : undefined,
      })}
      <AnimatePresence initial={false}>
        {message ? (
          <motion.span
            animate={{ height: 'auto', opacity: 1 }}
            className="block overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            key="message"
            transition={transition}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                className={error ? 'block pt-2 text-xs text-destructive' : 'block pt-2 text-xs text-[var(--text-muted)]'}
                id={`${id}-message`}
                initial={reduced ? false : { y: '0.35em', opacity: 0, filter: `blur(${MOTION.blur.soft}px)` }}
                key={message}
                role={error ? 'alert' : undefined}
                transition={{ duration: reduced ? 0 : MOTION.duration.standard, ease: MOTION.ease.enter }}
              >
                {message}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export { Field };
