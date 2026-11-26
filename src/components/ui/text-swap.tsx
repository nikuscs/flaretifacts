'use client';

import { cn } from 'cn';
import { AnimatePresence, motion } from 'motion/react';
import { CHART } from '@/constants/chart.constants';

interface TextSwapProps {
  text: string;
  reduced: boolean;
  direction?: number;
  className?: string;
}

export function TextSwap({ text, reduced, direction = 1, className }: TextSwapProps) {
  return (
    <span className="relative block min-w-0">
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <motion.span
          animate="shown"
          className={cn('inline-block', className)}
          custom={direction}
          exit="gone"
          initial="hidden"
          key={text}
          variants={reduced ? CHART.textSwap.fade : CHART.textSwap.rise}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
