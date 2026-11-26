'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { useState } from 'react';
import { MOTION } from '@/constants/motion.constants';
import ChevronDown from '~icons/lucide/chevron-down';
import type { Variants } from 'motion/react';
import type { ReactNode } from 'react';

interface AccordionItem {
  id?: string;
  title: string;
  icon?: ReactNode;
  flush?: boolean;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: number;
}

function Accordion({ items, defaultOpen = 0 }: AccordionProps) {
  const [openValue, setOpenValue] = useState(defaultOpen >= 0 && defaultOpen < items.length ? String(defaultOpen) : '');
  const reduced = useReducedMotion();

  const panel: Variants = {
    open: {
      height: 'auto',
      opacity: 1,
      visibility: 'visible',
      transition: reduced ? { duration: 0 } : { height: MOTION.spring.smooth, opacity: { duration: MOTION.duration.standard, ease: MOTION.ease.enter } },
    },
    closed: {
      height: 0,
      opacity: 0,
      transitionEnd: { visibility: 'hidden' },
      transition: reduced ? { duration: 0 } : { height: MOTION.spring.smooth, opacity: { duration: MOTION.duration.fast, ease: MOTION.ease.standard } },
    },
  };

  const content: Variants = {
    open: {
      y: 0,
      filter: 'blur(0px)',
      transitionEnd: { filter: 'none' },
      transition: reduced ? { duration: 0 } : { y: MOTION.spring.smooth, filter: { duration: MOTION.duration.standard, ease: MOTION.ease.enter } },
    },
    closed: {
      y: -6,
      filter: `blur(${MOTION.blur.subtle}px)`,
      transition: reduced ? { duration: 0 } : { duration: MOTION.duration.fast, ease: MOTION.ease.standard },
    },
  };

  return (
    <AccordionPrimitive.Root className="w-full border-t border-border" collapsible type="single" value={openValue} onValueChange={setOpenValue}>
      {items.map((item, index) => {
        const open = openValue === String(index);

        return (
          <AccordionPrimitive.Item
            className="border-b border-border"
            id={item.id}
            key={`${item.title}-${index}`}
            value={String(index)}
          >
            <AccordionPrimitive.Header className="m-0">
              <AccordionPrimitive.Trigger className="group flex min-h-[3.125rem] w-full cursor-pointer items-center justify-between gap-5 py-2 text-left text-sm leading-(--leading-body) font-medium text-foreground transition-colors duration-(--duration-fast) ease-(--ease-standard) outline-none hover:text-(--text-secondary) focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none">
                <span className="flex items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-(--text-muted)">
                  {item.icon}
                  {item.title}
                </span>
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  className="inline-flex shrink-0 text-(--text-muted) transition-colors duration-(--duration-fast) ease-(--ease-standard) group-hover:text-foreground group-data-[state=open]:text-foreground motion-reduce:transition-none"
                  initial={false}
                  transition={reduced ? { duration: 0 } : MOTION.spring.snappy}
                >
                  <ChevronDown aria-hidden="true" height={17} width={17} />
                </motion.span>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content asChild forceMount>
              <motion.div
                animate={open ? 'open' : 'closed'}
                className="overflow-hidden text-sm leading-(--leading-body) text-(--text-secondary)"
                initial={false}
                variants={panel}
              >
                <motion.div className={item.flush ? 'pb-5 wrap-anywhere' : 'pr-8 pb-5 wrap-anywhere'} variants={content}>{item.content}</motion.div>
              </motion.div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
}

export { Accordion };
export type { AccordionItem };
