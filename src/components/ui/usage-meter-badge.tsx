'use client';

import { animate, AnimatePresence, motion, useMotionValue } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { TextSwap } from '@/components/ui/text-swap';
import { CHART } from '@/constants/chart.constants';
import { MOTION } from '@/constants/motion.constants';
import { chartSpring } from '@/utils/chart.utils';
import CircleAlert from '~icons/lucide/circle-alert';
import TriangleAlert from '~icons/lucide/triangle-alert';

interface UsageMeterBadgeProps {
  status: 'ok' | 'near' | 'over';
  text: string;
  reduced: boolean;
}

const usageMeterBadgeFit = chartSpring(MOTION.spring.morph, 0.01);

export function UsageMeterBadge({ status, text, reduced }: UsageMeterBadgeProps) {
  const inner = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | 'auto'>('auto');

  useLayoutEffect(() => {
    const node = inner.current;

    if (!node) {
      return;
    }

    let measured = false;

    const observer = new ResizeObserver(() => {
      const next = node.offsetWidth;

      if (measured && !reduced) {
        animate(width, next, usageMeterBadgeFit);
      } else {
        width.jump(next);
      }

      measured = next > 0;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [reduced, width]);

  return (
    <motion.span
      className="group/badge inline-flex h-6 flex-none justify-end overflow-hidden rounded-full border bg-card text-xs leading-none font-medium text-muted-foreground transition-colors duration-(--duration-standard) data-[status=near]:border-transparent data-[status=near]:bg-warning/12 data-[status=near]:text-foreground data-[status=over]:border-transparent data-[status=over]:bg-destructive/10 data-[status=over]:text-foreground motion-reduce:transition-none"
      data-status={status}
      style={{ width }}
    >
      <span className="inline-flex flex-none items-center gap-1.5 px-2.5 whitespace-nowrap" ref={inner}>
        <AnimatePresence initial={false} mode="popLayout">
          {status === 'ok' ? null : (
            <motion.span
              animate="shown"
              className="grid place-items-center group-data-[status=near]/badge:text-warning group-data-[status=over]/badge:text-destructive"
              exit="gone"
              initial="hidden"
              key={status}
              variants={reduced ? CHART.usageMeter.fade : CHART.usageMeter.pop}
            >
              {status === 'over' ? <TriangleAlert aria-hidden="true" className="size-3.5" /> : <CircleAlert aria-hidden="true" className="size-3.5" />}
            </motion.span>
          )}
        </AnimatePresence>
        <TextSwap reduced={reduced} text={text} />
      </span>
    </motion.span>
  );
}
