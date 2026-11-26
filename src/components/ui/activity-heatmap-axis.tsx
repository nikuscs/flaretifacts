import { datesWeekdayShort } from '@/utils/dates.utils';
import styles from './activity-heatmap.module.css';
import type * as ReactTypes from 'react';

interface ActivityHeatmapAxisProps {
  months: { key: string; col: number; label: string }[];
}

export function ActivityHeatmapAxis({ months }: ActivityHeatmapAxisProps) {
  return (
    <>
      <div aria-hidden="true" className={styles.months}>
        {months.map((month) => (
          <span
            className={styles.month}
            key={month.key}
            // SAFETY: ReactTypes.CSSProperties has no index signature for custom properties; this key is a CSS variable.
            style={{ '--col': month.col } as ReactTypes.CSSProperties}
          >
            {month.label}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={styles.weekdays}>
        {Array.from({ length: 7 }, (_day, row) => (
          <span className={styles.weekday} key={row}>
            {row % 2 === 0 && row < 5 ? datesWeekdayShort(new Date(Date.UTC(1970, 0, 5 + row))) : ''}
          </span>
        ))}
      </div>
    </>
  );
}
