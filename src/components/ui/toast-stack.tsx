'use client';

import { cn } from 'cn';
import { animate, AnimatePresence, motion, useIsPresent, useMotionValue, usePresence, useReducedMotion, useTransform } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MOTION } from '@/constants/motion.constants';
import CircleCheck from '~icons/lucide/circle-check';
import CircleX from '~icons/lucide/circle-x';
import Info from '~icons/lucide/info';
import TriangleAlert from '~icons/lucide/triangle-alert';
import X from '~icons/lucide/x';
import styles from './toast-stack.module.css';
import type * as MotionTypes from 'motion/react';
import type * as ReactTypes from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

export interface ToastAction {
  label: string;
  onClick: (id: string) => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
}

export interface ToastStackApi {
  toast: (options: ToastOptions) => string;
  update: (id: string, patch: Partial<Omit<ToastOptions, 'id'>>) => void;
  dismiss: (id?: string) => void;
}

interface ToastStackProviderProps {
  children: ReactTypes.ReactNode;
  duration?: number;
  limit?: number;
}

interface ToastStackProps {
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  contained?: boolean;
  visibleToasts?: number;
  hotkey?: boolean;
  className?: string;
}

interface ToastStackRecord {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration: number;
  seq: number;
  version: number;
}

interface ToastStackStore extends ToastStackApi {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ToastStackRecord[];
  runAction: (id: string) => void;
}

interface ToastStackTarget {
  y: number;
  scale: number;
  height: number;
  opacity: number;
  content: number;
}

interface ToastStackGesture {
  pointerId: number;
  startX: number;
  startY: number;
  origin: number;
  active: boolean;
  samples: { t: number; x: number }[];
}

const toastStackPeek = 14;
const toastStackGap = 12;
const toastStackStep = 0.05;
const toastStackBorder = 2;
const toastStackSwipeFade = 280;
const toastStackEmpty: ToastStackRecord[] = [];
const toastStackTypeLabels = { success: 'Success', info: 'Info', warning: 'Warning', error: 'Error', loading: 'In progress' } satisfies Record<ToastType, string>;
const toastStackIcons = { success: CircleCheck, info: Info, warning: TriangleAlert, error: CircleX };

const toastStackFade: MotionTypes.Transition = { duration: MOTION.duration.fast, ease: [...MOTION.ease.standard] };
const toastStackEnterFade: MotionTypes.Transition = { duration: MOTION.duration.standard, ease: [...MOTION.ease.enter] };
const toastStackTextIn: MotionTypes.TargetAndTransition = { opacity: 0, y: '0.3em', filter: `blur(${MOTION.blur.soft}px)` };
const toastStackTextOut: MotionTypes.TargetAndTransition = { opacity: 0, y: '-0.3em', filter: `blur(${MOTION.blur.subtle}px)`, transition: toastStackFade };
const toastStackIconIn: MotionTypes.TargetAndTransition = { opacity: 0, scale: 0.6, filter: `blur(${MOTION.blur.subtle}px)` };
const toastStackShown: MotionTypes.TargetAndTransition = { opacity: 1, y: '0em', scale: 1, filter: 'blur(0px)' };

const toastStackFadeOnly: MotionTypes.MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: toastStackFade },
  transition: toastStackFade,
};

const toastStackTextSwap: MotionTypes.MotionProps = {
  initial: toastStackTextIn,
  animate: toastStackShown,
  exit: toastStackTextOut,
  transition: toastStackEnterFade,
};

const toastStackIconSwap: MotionTypes.MotionProps = {
  initial: toastStackIconIn,
  animate: toastStackShown,
  exit: { ...toastStackIconIn, transition: toastStackFade },
  transition: { ...MOTION.spring.snappy, opacity: toastStackFade, filter: toastStackFade },
};

function toastStackDuration(type: ToastType, base: number) {
  if (type === 'loading') {
    return Infinity;
  }

  return type === 'warning' || type === 'error' ? base * 1.6 : base;
}

function toastStackProject(velocity: number) {
  return (velocity / 1000) * 0.99 / (1 - 0.99);
}

function toastStackRubberBand(distance: number, dimension: number) {
  return (1 - 1 / ((distance * 0.55) / dimension + 1)) * dimension;
}

function toastStackSubscribeVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener);

  return () => document.removeEventListener('visibilitychange', listener);
}

function toastStackFocusVisible(element: Element) {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}

function toastStackOnControl(target: EventTarget) {
  return target instanceof Element && target.closest('button, a') !== null;
}

function toastStackLayout(toasts: ToastStackRecord[], heights: Record<string, number>, expanded: boolean, visibleToasts: number) {
  const heightOf = (record: ToastStackRecord | undefined) => (record ? heights[record.id] ?? 0 : 0);
  const front = heightOf(toasts[0]);
  const tops = [0];

  toasts.forEach((record, index) => {
    tops.push((tops[index] ?? 0) + (index < visibleToasts ? heightOf(record) + toastStackGap : 0));
  });

  const targets = toasts.map((record, index): ToastStackTarget => {
    const opacity = index < visibleToasts ? 1 : 0;
    const depth = Math.min(index, visibleToasts);

    if (expanded) {
      return { y: -(tops[index] ?? 0), scale: 1, height: heightOf(record), opacity, content: 1 };
    }

    const isFront = index === 0;

    return { y: -toastStackPeek * depth, scale: 1 - toastStackStep * depth, height: isFront ? heightOf(record) : front, opacity, content: isFront ? 1 : 0 };
  });

  return { targets, listHeight: toastStackListHeight(toasts.length, tops, front, expanded, visibleToasts) };
}

function toastStackListHeight(count: number, tops: number[], front: number, expanded: boolean, visibleToasts: number) {
  if (count === 0) {
    return 0;
  }

  if (expanded) {
    return (tops[count] ?? 0) - toastStackGap;
  }

  return front + toastStackPeek * (Math.min(count, visibleToasts) - 1);
}

function toastStackCreateStore(base: number, limit: number): ToastStackStore {
  let toasts: ToastStackRecord[] = [];
  let seq = 0;
  const listeners = new Set<() => void>();

  const commit = (next: ToastStackRecord[]) => {
    toasts = next;
    listeners.forEach((listener) => listener());
  };

  const update: ToastStackApi['update'] = (id, patch) => {
    const found = toasts.find((record) => record.id === id);

    if (!found) {
      return;
    }

    const type = patch.type ?? found.type;
    const record: ToastStackRecord = { ...found, ...patch, type, duration: patch.duration ?? toastStackDuration(type, base), version: found.version + 1 };

    commit(toasts.map((item) => (item.id === id ? record : item)));
  };

  const toast: ToastStackApi['toast'] = ({ id, ...options }) => {
    if (id && toasts.some((record) => record.id === id)) {
      update(id, options);

      return id;
    }

    const type = options.type ?? 'info';
    seq += 1;
    const record: ToastStackRecord = { ...options, id: id ?? `toast-${seq}`, type, duration: options.duration ?? toastStackDuration(type, base), seq, version: 0 };

    commit([record, ...toasts].slice(0, limit));

    return record.id;
  };

  const dismiss: ToastStackApi['dismiss'] = (id) => {
    if (id === undefined) {
      if (toasts.length > 0) {
        commit([]);
      }

      return;
    }

    if (toasts.some((record) => record.id === id)) {
      commit(toasts.filter((record) => record.id !== id));
    }
  };

  const runAction = (id: string) => {
    const found = toasts.find((record) => record.id === id);

    if (!found?.action) {
      return;
    }

    found.action.onClick(id);

    if (toasts.find((record) => record.id === id)?.version === found.version) {
      dismiss(id);
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  return { toast, update, dismiss, runAction, subscribe, getSnapshot: () => toasts };
}

const ToastStackContext = createContext<ToastStackStore | null>(null);

class ToastStackContextError extends Error {}

function useToastStackStore() {
  const store = useContext(ToastStackContext);

  if (!store) {
    throw new ToastStackContextError('Render toast stack consumers inside <ToastStackProvider>.');
  }

  return store;
}

export function ToastStackProvider({ children, duration = 5000, limit = 12 }: ToastStackProviderProps) {
  const [store] = useState(() => toastStackCreateStore(duration, limit));

  return <ToastStackContext.Provider value={store}>{children}</ToastStackContext.Provider>;
}

export function useToastStack(): ToastStackApi & { count: number } {
  const store = useToastStackStore();
  const count = useSyncExternalStore(store.subscribe, () => store.getSnapshot().length, () => 0);

  return { toast: store.toast, update: store.update, dismiss: store.dismiss, count };
}

function ToastStackSwap(props: MotionTypes.HTMLMotionProps<'span'>) {
  const present = useIsPresent();

  return <motion.span {...props} aria-hidden={present ? props['aria-hidden'] : true} />;
}

interface ToastStackItemProps {
  toast: ToastStackRecord;
  target: ToastStackTarget;
  expanded: boolean;
  front: boolean;
  hidden: boolean;
  paused: boolean;
  reduce: boolean;
  store: ToastStackStore;
  onMeasure: (id: string, height: number) => void;
  onDragChange: (dragging: boolean) => void;
  onTap: () => void;
  onHandOff: (leaving: HTMLElement, keyboard: boolean) => void;
}

function ToastStackItem({ toast, target, expanded, front, hidden, paused, reduce, store, onMeasure, onDragChange, onTap, onHandOff }: ToastStackItemProps) {
  const { id } = toast;
  const [isPresent, safeToRemove] = usePresence();
  const itemRef = useRef<HTMLLIElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const height = useMotionValue(0);
  const opacity = useMotionValue(0);
  const contentOpacity = useMotionValue(1);
  const x = useMotionValue(0);
  const swipeFade = useTransform(x, (value) => (value > 0 ? 1 - Math.min(value / toastStackSwipeFade, 1) * 0.75 : 1));
  const applied = useRef<boolean | null>(null);
  const swiped = useRef(false);
  const remaining = useRef(toast.duration);
  const gesture = useRef<ToastStackGesture | null>(null);
  const suppressClick = useRef(false);
  const pointerType = useRef('mouse');

  useLayoutEffect(() => {
    const node = contentRef.current;

    if (!node) {
      return;
    }

    onMeasure(id, node.offsetHeight + toastStackBorder);
    const observer = new ResizeObserver(() => onMeasure(id, node.offsetHeight + toastStackBorder));
    observer.observe(node);

    return () => observer.disconnect();
  }, [id, onMeasure]);

  useLayoutEffect(() => {
    if (!isPresent || target.height <= 0) {
      return;
    }

    const entering = applied.current === null;
    const morph = !entering && applied.current !== expanded;
    applied.current = expanded;

    if (reduce) {
      y.jump(target.y);
      scale.jump(target.scale);
      height.jump(target.height);
      void animate(opacity, target.opacity, toastStackFade);
      void animate(contentOpacity, target.content, toastStackFade);

      return;
    }

    if (entering) {
      y.jump(target.y + target.height);
      scale.jump(target.scale);
      height.jump(target.height);
      contentOpacity.jump(target.content);
      opacity.jump(0);
    }

    const spring = morph ? MOTION.spring.morph : MOTION.spring.smooth;
    void animate(y, target.y, spring);
    void animate(scale, target.scale, spring);

    if (!entering) {
      void animate(height, target.height, spring);
    }

    void animate(opacity, target.opacity, entering ? toastStackEnterFade : toastStackFade);
    void animate(contentOpacity, target.content, toastStackFade);
  }, [contentOpacity, expanded, height, isPresent, opacity, reduce, scale, target.content, target.height, target.opacity, target.scale, target.y, y]);

  useEffect(() => {
    remaining.current = toast.duration;
  }, [toast.version, toast.duration]);

  useEffect(() => {
    if (!isPresent || paused || !Number.isFinite(remaining.current) || toast.duration <= 0) {
      return;
    }

    const started = performance.now();
    const timer = window.setTimeout(() => store.dismiss(id), Math.max(remaining.current, 0));

    return () => {
      window.clearTimeout(timer);
      remaining.current -= performance.now() - started;
    };
  }, [id, isPresent, paused, store, toast.version, toast.duration]);

  useEffect(() => {
    if (isPresent) {
      return;
    }

    const node = itemRef.current;

    if (node) {
      const active = document.activeElement;

      if (active instanceof HTMLElement && node.contains(active)) {
        onHandOff(node, toastStackFocusVisible(active));
      }

      node.setAttribute('inert', '');
    }

    if (reduce) {
      void animate(opacity, 0, { ...toastStackFade, onComplete: safeToRemove });

      return;
    }

    if (!swiped.current) {
      void animate(y, y.get() + 10, MOTION.spring.smooth);
      void animate(scale, scale.get() * 0.96, MOTION.spring.smooth);
    }

    void animate(opacity, 0, {
      duration: swiped.current ? 0.22 : MOTION.duration.exit,
      ease: [...MOTION.ease.standard],
      onComplete: safeToRemove,
    });
  }, [isPresent, onHandOff, opacity, reduce, safeToRemove, scale, y]);

  function onPointerDown(event: ReactTypes.PointerEvent<HTMLDivElement>) {
    pointerType.current = event.pointerType;
    suppressClick.current = false;

    if (event.button !== 0 || !isPresent || toastStackOnControl(event.target)) {
      return;
    }

    x.stop();
    gesture.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: x.get(), active: false, samples: [] };
  }

  function onPointerMove(event: ReactTypes.PointerEvent<HTMLDivElement>) {
    const current = gesture.current;

    if (current?.pointerId !== event.pointerId) {
      return;
    }

    if (!current.active) {
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;

      if (Math.hypot(dx, dy) < 6) {
        return;
      }

      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;

        return;
      }

      current.active = true;
      current.startX = event.clientX;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = '';
      window.getSelection()?.removeAllRanges();
      onDragChange(true);
    }

    const raw = current.origin + event.clientX - current.startX;
    x.set(raw >= 0 ? raw : -toastStackRubberBand(-raw, event.currentTarget.offsetWidth));
    current.samples.push({ t: event.timeStamp, x: raw });

    while (current.samples.length > 2 && event.timeStamp - (current.samples[0]?.t ?? 0) > 100) {
      current.samples.shift();
    }
  }

  function releaseVelocity(current: ToastStackGesture, event: ReactTypes.PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const first = current.samples[0];
    const last = current.samples.at(-1);

    if (cancelled || !last || last.t === first.t || event.timeStamp - last.t > 60) {
      return 0;
    }

    return ((last.x - first.x) / (last.t - first.t)) * 1000;
  }

  function onPointerEnd(event: ReactTypes.PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const current = gesture.current;

    if (current?.pointerId !== event.pointerId) {
      return;
    }

    gesture.current = null;

    if (!current.active) {
      return;
    }

    delete event.currentTarget.dataset.dragging;
    onDragChange(false);
    const velocity = releaseVelocity(current, event, cancelled);
    const width = event.currentTarget.offsetWidth;
    const offset = x.get();

    if (!cancelled && offset > 0 && velocity > -200 && offset + toastStackProject(velocity) > width * 0.4) {
      swiped.current = true;

      if (!reduce) {
        void animate(x, width + 40, {
          type: 'spring',
          visualDuration: 0.32,
          bounce: 0,
          velocity: Math.max(velocity, 0),
        });
      }

      store.dismiss(id);

      return;
    }

    if (reduce) {
      x.jump(0);

      return;
    }

    void animate(x, 0, { ...MOTION.spring.snappy, velocity: offset < 0 ? velocity * 0.3 : velocity });
  }

  function onCardClick(event: ReactTypes.MouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;

      return;
    }

    if (pointerType.current !== 'mouse' && !toastStackOnControl(event.target)) {
      onTap();
    }
  }

  function runAction(event: ReactTypes.MouseEvent<HTMLButtonElement>) {
    const keyboard = toastStackFocusVisible(event.currentTarget);
    store.runAction(id);

    if (keyboard && !store.getSnapshot().find((record) => record.id === id)?.action) {
      closeRef.current?.focus();
    }
  }

  function onKeyDown(event: ReactTypes.KeyboardEvent<HTMLLIElement>) {
    if (event.key !== 'Escape') {
      return;
    }

    event.stopPropagation();
    store.dismiss(id);
  }

  function markMoving(moving: boolean) {
    if (actionRef.current) {
      actionRef.current.dataset.moving = moving ? 'true' : 'false';
    }
  }

  const Icon = toast.type === 'loading' ? null : toastStackIcons[toast.type];
  const swap = reduce ? toastStackFadeOnly : toastStackTextSwap;

  return (
    <motion.li
      className={styles.item}
      data-expanded={expanded}
      data-front={front}
      inert={hidden}
      onKeyDown={onKeyDown}
      ref={itemRef}
      style={{ y, scale, height, opacity, zIndex: toast.seq }}
    >
      <motion.div
        className={styles.card}
        onClick={onCardClick}
        onPointerCancel={(event) => onPointerEnd(event, true)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => onPointerEnd(event, false)}
        style={{ x, opacity: swipeFade }}
      >
        <motion.div className={styles.content} ref={contentRef} style={{ opacity: contentOpacity }}>
          <span aria-hidden="true" className={styles.icon} data-type={toast.type}>
            <AnimatePresence initial={false} mode="popLayout">
              <ToastStackSwap className={styles.glyph} key={toast.type} {...(reduce ? toastStackFadeOnly : toastStackIconSwap)}>
                {Icon ? <Icon height={18} width={18} className="[&_g]:stroke-[1.75]" /> : <span className={styles.spinner} />}
              </ToastStackSwap>
            </AnimatePresence>
          </span>
          <div className={styles.copy}>
            <span className={styles.srOnly}>{toastStackTypeLabels[toast.type]}: </span>
            <span className={styles.title}>
              <AnimatePresence initial={false} mode="popLayout">
                <ToastStackSwap className={styles.line} key={toast.title} {...swap}>{toast.title}</ToastStackSwap>
              </AnimatePresence>
            </span>
            <AnimatePresence initial={false} mode="popLayout">
              {toast.description ? <ToastStackSwap className={styles.description} key={toast.description} {...swap}>{toast.description}</ToastStackSwap> : null}
            </AnimatePresence>
          </div>
          <AnimatePresence initial={false}>
            {toast.action ? (
              <motion.div
                animate={{ width: 'auto', opacity: 1 }}
                className={styles.actionSlot}
                exit={reduce ? { opacity: 0 } : { width: 0, opacity: 0 }}
                initial={reduce ? { opacity: 0 } : { width: 0, opacity: 0 }}
                key="action"
                onAnimationComplete={() => markMoving(false)}
                onAnimationStart={() => markMoving(true)}
                ref={actionRef}
                transition={reduce ? toastStackFade : { width: MOTION.spring.smooth, opacity: toastStackFade }}
              >
                <button className={styles.action} onClick={runAction} type="button">{toast.action.label}</button>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <button aria-label="Dismiss notification" className={styles.close} onClick={() => store.dismiss(id)} ref={closeRef} type="button">
            <X aria-hidden="true" height={16} width={16} className="[&_g]:stroke-[1.75]" />
          </button>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}

export function ToastStack({ label = 'Notifications', position = 'bottom-right', contained = false, visibleToasts = 3, hotkey = true, className }: ToastStackProps) {
  const store = useToastStackStore();
  const toasts = useSyncExternalStore(store.subscribe, store.getSnapshot, () => toastStackEmpty);
  const reduce = Boolean(useReducedMotion());
  const pageHidden = useSyncExternalStore(toastStackSubscribeVisibility, () => document.visibilityState === 'hidden', () => false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const regionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  if (tapped && toasts.length === 0) {
    setTapped(false);
  }

  const expanded = toasts.length > 0 && (hovered || focused || tapped);
  const paused = expanded || dragging || pageHidden;

  const measure = useCallback((id: string, height: number) => {
    setHeights((current) => (current[id] === height ? current : { ...current, [id]: height }));
  }, []);

  const prune = useCallback(() => {
    setHeights((current) => Object.fromEntries(store.getSnapshot().flatMap((record) => (record.id in current ? [[record.id, current[record.id] ?? 0]] : []))));
  }, [store]);

  const toggleTap = useCallback(() => setTapped((open) => !open), []);

  const handOff = useCallback((leaving: HTMLElement, keyboard: boolean) => {
    const items = Array.from(listRef.current?.children ?? []).filter((item) => item instanceof HTMLElement);
    const at = items.indexOf(leaving);
    const candidates = items.filter((item) => item !== leaving && !item.hasAttribute('inert'));
    const next = candidates.find((item) => items.indexOf(item) > at) ?? candidates.at(-1);
    const button = next?.querySelector<HTMLElement>('button');

    if (keyboard && button) {
      button.focus();

      return;
    }

    if (keyboard && returnFocus.current?.isConnected) {
      returnFocus.current.focus();

      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  useEffect(() => {
    if (!hotkey) {
      return;
    }

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || event.metaKey || event.ctrlKey || event.code !== 'KeyT') {
        return;
      }

      const target = listRef.current?.querySelector<HTMLElement>(':scope > li:not([inert]) button');

      if (!target) {
        return;
      }

      event.preventDefault();
      target.focus({ focusVisible: true });
      setFocused(true);
    };

    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey]);

  useEffect(() => {
    if (!tapped) {
      return;
    }

    const onDown = (event: PointerEvent) => {
      if (event.target instanceof Node && regionRef.current?.contains(event.target)) {
        return;
      }

      setTapped(false);
    };

    document.addEventListener('pointerdown', onDown);

    return () => document.removeEventListener('pointerdown', onDown);
  }, [tapped]);

  useEffect(() => {
    const region = regionRef.current;

    if (!region) {
      return;
    }

    const onFocusIn = (event: globalThis.FocusEvent) => {
      const from = event.relatedTarget;

      if (!(from instanceof Node) || !region.contains(from)) {
        returnFocus.current = from instanceof HTMLElement ? from : null;
      }

      if (event.target instanceof Element && toastStackFocusVisible(event.target)) {
        setFocused(true);
      }
    };

    const onFocusOut = (event: globalThis.FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !region.contains(event.relatedTarget)) {
        setFocused(false);
      }
    };

    region.addEventListener('focusin', onFocusIn);
    region.addEventListener('focusout', onFocusOut);

    return () => {
      region.removeEventListener('focusin', onFocusIn);
      region.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const { targets, listHeight } = toastStackLayout(toasts, heights, expanded, visibleToasts);

  function onListPointer(event: ReactTypes.PointerEvent<HTMLOListElement>, inside: boolean) {
    if (event.pointerType === 'mouse' && hovered !== inside) {
      setHovered(inside);
    }
  }

  return (
    <section
      aria-atomic="false"
      aria-label={hotkey ? `${label} (Alt+T)` : label}
      aria-live="polite"
      aria-relevant="additions text"
      className={cn(styles.viewport, styles[position], contained && styles.contained, className)}
      ref={regionRef}
    >
      <ol
        className={styles.list}
        data-expanded={expanded}
        onPointerEnter={(event) => onListPointer(event, true)}
        onPointerLeave={(event) => onListPointer(event, false)}
        onPointerMove={(event) => onListPointer(event, true)}
        ref={listRef}
        style={{ height: listHeight }}
      >
        <AnimatePresence onExitComplete={prune}>
          {toasts.map((record, index) => (
            <ToastStackItem
              expanded={expanded}
              front={index === 0}
              hidden={index >= visibleToasts}
              key={record.id}
              onDragChange={setDragging}
              onHandOff={handOff}
              onMeasure={measure}
              onTap={toggleTap}
              paused={paused}
              reduce={reduce}
              store={store}
              target={targets[index] ?? { y: 0, scale: 1, height: 0, opacity: 0, content: 0 }}
              toast={record}
            />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
