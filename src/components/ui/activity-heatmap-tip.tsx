'use client';

import { animate, AnimatePresence, motion, useMotionValue } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { MOTION } from '@/constants/motion.constants';
import styles from './activity-heatmap.module.css';
import type * as ReactTypes from 'react';

export interface ActivityHeatmapTipContent {
  key: string;
  primary: string;
  secondary: string;
  anchor: HTMLElement;
}

interface ActivityHeatmapTipProps {
  tip: ActivityHeatmapTipContent | null;
  open: boolean;
  reduced: boolean;
  rootRef: ReactTypes.RefObject<HTMLDivElement | null>;
  scrollerRef: ReactTypes.RefObject<HTMLDivElement | null>;
}

export function ActivityHeatmapTip({ tip, open, reduced, rootRef, scrollerRef }: ActivityHeatmapTipProps) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  const tipX = useMotionValue(0);
  const tipY = useMotionValue(0);
  const tipWidth = useMotionValue<number | 'auto'>('auto');
  const textTransition = { duration: reduced ? MOTION.duration.fast : MOTION.duration.standard, ease: MOTION.ease.enter };

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;

    if (!tip || !root || !measure) {
      return undefined;
    }

    const place = (glide: boolean) => {
      const box = root.getBoundingClientRect();
      const cell = tip.anchor.getBoundingClientRect();
      const width = Math.ceil(measure.getBoundingClientRect().width);
      const half = width / 2 + 13;
      const x = Math.min(Math.max(cell.left - box.left + cell.width / 2, half + 2), box.width - half - 2);
      const y = cell.top - box.top;

      if (glide) {
        void animate(tipX, x, MOTION.spring.snappy);
        void animate(tipY, y, MOTION.spring.snappy);
        void animate(tipWidth, width, MOTION.spring.morph);
      } else {
        tipX.jump(x);
        tipY.jump(y);
        tipWidth.jump(width);
      }
    };

    place(open && openRef.current && !reduced);
    openRef.current = open;

    const scroller = scrollerRef.current;
    const follow = () => place(false);

    scroller?.addEventListener('scroll', follow, { passive: true });

    return () => scroller?.removeEventListener('scroll', follow);
  }, [tip, open, reduced, rootRef, scrollerRef, tipX, tipY, tipWidth]);

  return (
    <motion.div aria-hidden="true" className={styles.tip} style={{ x: tipX, y: tipY }}>
      <motion.div
        animate={open && tip ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduced ? 1 : 0.96 }}
        className={styles.bubble}
        initial={false}
        style={{ x: '-50%' }}
        transition={open ? { ...MOTION.spring.snappy, opacity: { duration: MOTION.duration.fast } } : { duration: MOTION.duration.instant }}
      >
        <motion.span className={styles.tipBody} style={{ width: tipWidth }}>
          <span className={styles.tipMeasure} ref={measureRef}>
            <span className={styles.tipPrimary}>{tip?.primary}</span>
            <span className={styles.tipSecondary}>{tip?.secondary}</span>
          </span>
          <AnimatePresence initial={false} mode="popLayout">
            {tip ? (
              <motion.span
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                className={styles.tipLines}
                exit={{ opacity: 0, transition: { duration: MOTION.duration.instant } }}
                initial={{ opacity: 0, filter: `blur(${MOTION.blur.subtle}px)` }}
                key={tip.key}
                transition={textTransition}
              >
                <span className={styles.tipPrimary}>{tip.primary}</span>
                <span className={styles.tipSecondary}>{tip.secondary}</span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
