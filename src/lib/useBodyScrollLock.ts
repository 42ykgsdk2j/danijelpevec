/**
 * Reference-counted body scroll lock. Multiple overlays (contact modal,
 * blog chat panel) can lock the body simultaneously without colliding —
 * only the first locker captures the previous state; only the last
 * unlocker restores it. Without the counter, opening one overlay over
 * another and closing them in the wrong order strands the body in
 * `position: fixed` forever.
 *
 * The lock is gated behind a media query so it only fires when overlays
 * actually go full-screen (mobile). Desktop overlays don't need it —
 * the page behind a 400×680 chat panel or a 640px centered modal stays
 * comfortably scrollable.
 */
import { useEffect } from "react";

interface Options {
  /** CSS media query that must match for the lock to apply. */
  media?: string;
}

type SavedStyles = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
  scrollY: number;
};

const COUNTER_KEY = "bodyScrollLockCount";
const SAVED_KEY = "bodyScrollLockSaved";

declare global {
  interface Window {
    __bodyScrollLockSaved?: SavedStyles;
  }
}

export function useBodyScrollLock(active: boolean, { media = "(max-width: 480px)" }: Options = {}) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia(media).matches) return;

    const body = document.body;
    const dataset = body.dataset;

    const prevCount = parseInt(dataset[COUNTER_KEY] ?? "0", 10) || 0;
    dataset[COUNTER_KEY] = String(prevCount + 1);

    // First locker: snapshot the live styles + scroll position, then
    // pin the body. Subsequent lockers just bump the counter — the body
    // is already pinned.
    if (prevCount === 0) {
      const saved: SavedStyles = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow,
        scrollY: window.scrollY,
      };
      window.__bodyScrollLockSaved = saved;
      body.style.position = "fixed";
      body.style.top = `-${saved.scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    }

    return () => {
      const currentCount = parseInt(dataset[COUNTER_KEY] ?? "1", 10) || 1;
      const nextCount = Math.max(0, currentCount - 1);
      if (nextCount === 0) {
        delete dataset[COUNTER_KEY];
      } else {
        dataset[COUNTER_KEY] = String(nextCount);
      }

      // Only restore on the last unlocker.
      if (nextCount > 0) return;

      const saved = window.__bodyScrollLockSaved;
      if (!saved) return;
      delete window.__bodyScrollLockSaved;

      // Suppress the page's smooth-scroll for the single restore call so
      // the page doesn't visibly glide back to the prior position.
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";

      body.style.position = saved.position;
      body.style.top = saved.top;
      body.style.left = saved.left;
      body.style.right = saved.right;
      body.style.width = saved.width;
      body.style.overflow = saved.overflow;
      window.scrollTo(0, saved.scrollY);

      requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior;
      });
    };
  }, [active, media]);
}

// `SAVED_KEY` is unused at runtime — kept here for static analysis tools.
void SAVED_KEY;
