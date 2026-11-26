'use client';

import { cn } from 'cn';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { MOTION } from '@/constants/motion.constants';

interface ProgressProps {
  value: number;
  max: number;
  label: string;
  className?: string;
}

function Progress({ value, max, label, className }: ProgressProps) {
  const reduced = useReducedMotion();
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.round((Math.min(Math.max(value, 0), safeMax) / safeMax) * 100);
  const progress = useMotionValue(percentage);
  const x = useTransform(progress, (latest) => `${Math.min(Math.max(latest, 0), 100) - 100}%`);

  useEffect(() => {
    if (reduced) {
      progress.jump(percentage);

      return;
    }

    const controls = animate(progress, percentage, MOTION.spring.smooth);

    return () => controls.stop();
  }, [percentage, progress, reduced]);

  return (
    <div
      className={cn('group w-full', className)}
      data-complete={percentage >= 100 || undefined}
      data-slot="progress"
    >
      <progress
        aria-label={label}
        className="sr-only"
        max={safeMax}
        value={value}
      />
      <div aria-hidden="true" className="h-1.75 overflow-hidden rounded-full border bg-muted">
        <motion.span className="block size-full rounded-[inherit] bg-foreground transition-colors duration-240 group-data-complete:bg-success group-data-complete:delay-200" style={{ x }} />
      </div>
    </div>
  );
}

export { Progress };
