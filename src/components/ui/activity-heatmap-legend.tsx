'use client';

import { cn } from 'cn';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION } from '@/constants/motion.constants';
import styles from './activity-heatmap.module.css';
import type { ActivityHeatmapTone } from '@/components/ui/activity-heatmap';
import type * as ReactTypes from 'react';

interface ActivityHeatmapLegendProps {
  id: string;
  unit: { one: string; other: string };
  bounds: number[];
  perLevel: number[];
  highlight: number | null;
  pinned: number | null;
  caption: ReactTypes.ReactNode;
  tones: { tone: ActivityHeatmapTone; label: string }[] | undefined;
  reduced: boolean;
  onPinnedChange: (level: number | null) => void;
  onPreviewChange: (level: number | null) => void;
}

const activityHeatmapLegendNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

export function ActivityHeatmapLegend({
  id,
  unit,
  bounds,
  perLevel,
  highlight,
  pinned,
  caption,
  tones,
  reduced,
  onPinnedChange,
  onPreviewChange,
}: ActivityHeatmapLegendProps) {
  const [low = 1, middle = 2, high = 3] = bounds.map((bound) => activityHeatmapLegendNumber.format(bound));

  const ranges = [
    `no ${unit.other}`,
    low === '1' ? `1 ${unit.one}` : `up to ${low} ${unit.other}`,
    `${low}–${middle} ${unit.other}`,
    `${middle}–${high} ${unit.other}`,
    `over ${high} ${unit.other}`,
  ];

  const levelCaption = highlight === null
    ? null
    : `${perLevel[highlight] ?? 0} ${perLevel[highlight] === 1 ? 'day' : 'days'} with ${ranges[highlight] ?? ''}`;

  return (
    <div className={styles.legend}>
      <span className={styles.srOnly} id={id}>{`Darker squares mean more ${unit.other}. Levels: ${ranges.join(', ')}.`}</span>
      <span aria-live="polite" className={styles.caption}>
        <span className={styles.rise}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
              className={styles.riseLine}
              exit={{ opacity: 0, y: reduced ? '0em' : '-0.3em', transition: { duration: MOTION.duration.instant } }}
              initial={{ opacity: 0, y: reduced ? '0em' : '0.3em', filter: `blur(${MOTION.blur.soft}px)` }}
              key={levelCaption ?? 'caption'}
              transition={{ duration: reduced ? MOTION.duration.fast : MOTION.duration.standard, ease: MOTION.ease.enter }}
            >
              {levelCaption ?? caption}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
      <span className={styles.scale}>
        {tones?.map((key) => (
          <span className={styles.toneKey} data-tone={key.tone} key={key.tone}>{key.label}</span>
        ))}
        <span aria-hidden="true" className={styles.legendText}>Less</span>
        <fieldset aria-label="Highlight days by level" className={cn(styles.swatches, 'm-0 min-w-0 border-0 p-0')}>
          {perLevel.map((_count, level) => (
            <button
              aria-label={`Highlight days with ${ranges[level] ?? ''}`}
              aria-pressed={pinned === level}
              className={styles.swatch}
              data-level={level}
              key={level}
              type="button"
              onBlur={() => onPreviewChange(null)}
              onClick={() => onPinnedChange(pinned === level ? null : level)}
              onFocus={() => onPreviewChange(level)}
              onPointerEnter={() => onPreviewChange(level)}
              onPointerLeave={() => onPreviewChange(null)}
            />
          ))}
        </fieldset>
        <span aria-hidden="true" className={styles.legendText}>More</span>
      </span>
    </div>
  );
}
