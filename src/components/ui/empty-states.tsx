'use client';

import { motion, useReducedMotion } from 'motion/react';
import { MOTION } from '@/constants/motion.constants';
import styles from './empty-states.module.css';
import type { ReactNode } from 'react';

type EmptyStatesScene = 'map' | 'offline';

interface EmptyStatesPath {
  kind: 'tile' | 'body' | 'stroke' | 'mark';
  tone: string;
  dash?: string;
  d: string;
}

interface EmptyStatesArt {
  paths: EmptyStatesPath[];
}

interface EmptyStatesProps {
  scene: EmptyStatesScene;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}

const EMPTY_STATES_ART = {
  map: {
    paths: [
      { kind: 'tile', tone: 'tuck', d: 'M193 80L196.1 80.4L199 81.6L201.5 83.5L203.4 86L204.6 88.9L205 92L205 124L204.6 127.1L203.4 130L201.5 132.5L199 134.4L196.1 135.6L193 136L127 136L123.9 135.6L121 134.4L118.5 132.5L116.6 130L115.4 127.1L115 124L115 92L115.4 88.9L116.6 86L118.5 83.5L121 81.6L123.9 80.4L127 80Z' },
      { kind: 'tile', tone: 'tuck', d: 'M201 73L204.6 73.5L208 74.9L210.9 77.1L213.1 80L214.5 83.4L215 87L215 129L214.5 132.6L213.1 136L210.9 138.9L208 141.1L204.6 142.5L201 143L119 143L115.4 142.5L112 141.1L109.1 138.9L106.9 136L105.5 132.6L105 129L105 87L105.5 83.4L106.9 80L109.1 77.1L112 74.9L115.4 73.5L119 73Z' },
      { kind: 'body', tone: 'outline', d: 'M79 63L133 49L187 63L241 49L241 153L187 167L133 153L79 167L79 66.1Z' },
      { kind: 'tile', tone: 'shade', d: 'M187 63L187 167L133 153L133 49Z' },
      { kind: 'tile', tone: 'dot', d: 'M99 139L100 139.1L101 139.5L101.8 140.2L102.5 141L102.9 142L103 143L102.9 144L102.5 145L101.8 145.8L101 146.5L100 146.9L99 147L98 146.9L97 146.5L96.2 145.8L95.5 145L95.1 144L95 143L95.1 142L95.5 141L96.2 140.2L97 139.5L98 139.1L99 139Z' },
      { kind: 'stroke', tone: 'accent', dash: '3 5', d: 'M99 143L101.2 140.3L103.4 137.6L105.5 134.8L107.8 132.2L110.1 129.7L112.8 127.4L115.7 125.5L119.1 124.8L122.5 125.4L125.7 126.7L128.8 128.2L132 129.7L135.2 130.9L138.7 131.4L142 130.5L144.8 128.5L147.2 125.9L149.3 123.2L151.3 120.3L153.2 117.5L155.3 114.7L157.6 112L160.1 109.7L163.1 107.8L166.3 106.5L169.6 105.5L173 104.8L176.5 104.1L179.9 103.4L183.2 102.5L186.5 101.3L189.5 99.6L192.5 97.8L195.3 95.8L198.1 93.7L200.9 91.5L203.6 89.4L206.3 87.2L209 85' },
      { kind: 'mark', tone: 'ink', d: 'M212 72L222 82M222 72L212 82' },
    ],
  },
  offline: {
    paths: [
      { kind: 'tile', tone: 'tuck', d: 'M186 65L189.9 65.5L193.5 67L196.6 69.4L199 72.5L200.5 76.1L201 80L200.5 83.9L199 87.5L196.6 90.6L193.5 93L189.9 94.5L186 95L136 95L132.1 94.5L128.5 93L125.4 90.6L123 87.5L121.5 83.9L121 80L121.5 76.1L123 72.5L125.4 69.4L128.5 67L132.1 65.5L136 65Z' },
      { kind: 'tile', tone: 'tuck', d: 'M195 62L199.6 62.6L204 64.4L207.7 67.3L210.6 71L212.4 75.3L213 80L212.4 84.7L210.6 89L207.7 92.7L204 95.6L199.6 97.4L195 98L127 98L122.3 97.4L118 95.6L114.3 92.7L111.4 89L109.6 84.7L109 80L109.6 75.3L111.4 71L114.3 67.3L118 64.4L122.3 62.6L127 62Z' },
      { kind: 'body', tone: 'outline', d: 'M101 62L103.1 62.1L105.1 62.4L107.1 62.9L107 60.5L107 58L107.3 55.6L107.7 53.2L108.2 50.9L109 48.6L109.9 46.3L110.9 44.2L112.1 42.1L113.5 40.1L114.9 38.2L116.6 36.4L118.3 34.7L120.2 33.1L122.1 31.7L124.2 30.4L126.3 29.3L128.5 28.4L130.8 27.6L133.2 26.9L135.5 26.4L137.9 26.1L140.3 26L142.8 26L145.2 26.3L147.6 26.6L149.9 27.2L152.2 27.9L154.5 28.8L156.7 29.8L158.8 31L160.8 32.4L162.7 33.8L164.5 35.4L166.2 37.2L167.7 39L169.2 41L170.4 43L172.3 41.5L174.3 40.2L176.3 39L178.5 38L180.8 37.2L183.1 36.6L185.4 36.2L187.8 36L190.2 36L192.5 36.2L194.9 36.6L197.2 37.2L199.4 38L201.6 39L203.7 40.2L205.6 41.5L207.5 43L209.2 44.6L210.8 46.4L212.2 48.3L213.4 50.4L214.5 52.5L215.4 54.7L216.1 57L216.6 59.3L216.9 61.7L217 64L216.9 66.4L219.2 66.1L221.6 66L224 66.2L226.4 66.7L228.6 67.5L230.8 68.6L232.8 69.8L234.6 71.4L236.3 73.1L237.7 75L238.9 77.1L239.8 79.3L240.5 81.6L240.9 83.9L241 86.3L240.8 88.7L240.3 91.1L239.6 93.3L238.6 95.5L237.3 97.5L235.8 99.4L234.1 101.1L232.2 102.5L230.2 103.8L228 104.7L225.7 105.4L223.4 105.9L221 106L101 106L98.6 105.9L96.3 105.5L94 104.9L91.8 104L89.6 102.9L87.7 101.5L85.9 100L84.2 98.2L82.8 96.3L81.6 94.3L80.6 92.1L79.8 89.9L79.3 87.6L79 85.2L79 82.8L79.3 80.4L79.8 78.1L80.6 75.9L81.6 73.7L82.8 71.7L84.2 69.8L85.9 68L87.7 66.5L89.6 65.2L91.8 64L94 63.2L96.3 62.5L98.6 62.1Z' },
      { kind: 'tile', tone: 'outline', d: 'M178 156L180.3 156.3L182.5 157.2L184.4 158.6L185.8 160.5L186.7 162.7L187 165L187 181L186.7 183.3L185.8 185.5L184.4 187.4L182.5 188.8L180.3 189.7L178 190L144 190L141.7 189.7L139.5 188.8L137.6 187.4L136.2 185.5L135.3 183.3L135 181L135 165L135.3 162.7L136.2 160.5L137.6 158.6L139.5 157.2L141.7 156.3L144 156Z' },
      { kind: 'stroke', tone: 'ink', d: 'M161 106L161 122' },
      { kind: 'stroke', tone: 'ink', d: 'M161 146L161 156' },
      { kind: 'mark', tone: 'warning', d: 'M151 139L159 129M163 139L171 129' },
    ],
  },
} satisfies Record<EmptyStatesScene, EmptyStatesArt>;

function EmptyStates({ scene, title, description, action }: EmptyStatesProps) {
  const reduced = Boolean(useReducedMotion());
  const paths: EmptyStatesPath[] = EMPTY_STATES_ART[scene].paths;
  const rise = reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' };
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, y: 8, filter: `blur(${MOTION.blur.soft}px)` };

  return (
    <section className="@container mx-auto w-full max-w-xl" data-slot="empty-states">
      <div className="flex flex-col items-center gap-[clamp(20px,4cqi,32px)] rounded-[20px] border bg-(--surface) px-[clamp(16px,4cqi,40px)] py-[clamp(16px,5cqi,48px)]">
        <div className="aspect-320/216 w-full max-w-[360px]">
          <svg aria-hidden="true" className="block size-full overflow-visible" viewBox="0 0 320 216">
            {paths.map((path, index) => {
              const draws = (path.kind === 'stroke' || path.kind === 'mark') && !path.dash;
              const delay = index * MOTION.stagger.item;
              const start = draws ? { opacity: 0, pathLength: 0 } : { opacity: 0, y: 6 };

              return (
                <motion.path
                  key={path.d}
                  animate={draws ? { opacity: 1, pathLength: 1 } : { opacity: 1, y: 0 }}
                  className={styles.shape}
                  d={path.d}
                  data-kind={path.kind}
                  data-tone={path.tone}
                  initial={reduced ? false : start}
                  strokeDasharray={path.dash}
                  transition={{ ...MOTION.spring.smooth, delay: draws ? delay + MOTION.stagger.line : delay }}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <div className="grid gap-1.5 px-2">
            <motion.h2
              animate={rise}
              className="text-lg leading-(--leading-body) font-medium tracking-(--tracking-body) text-balance @[560px]:text-xl"
              initial={hidden}
              transition={{ duration: MOTION.duration.considered, ease: MOTION.ease.enter, delay: 0.06 }}
            >
              {title}
            </motion.h2>
            <motion.p
              animate={rise}
              className="mx-auto max-w-[40ch] text-sm leading-(--leading-body) text-pretty text-(--text-secondary)"
              initial={hidden}
              transition={{ duration: MOTION.duration.considered, ease: MOTION.ease.enter, delay: 0.06 + MOTION.stagger.word }}
            >
              {description}
            </motion.p>
          </div>
          {action ? <div className="flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}

export { EmptyStates };
