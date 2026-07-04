import { useState, useEffect, useRef } from 'react';

/**
 * Drives a numeric value from `startValue` to `endValue` over `duration` ms
 * using requestAnimationFrame. Resets to `startValue` whenever `endValue`
 * changes, enabling BiasMeter to restart from neutral (0) on each new result.
 *
 * @param startValue - The value to begin the animation from (e.g. 0)
 * @param endValue   - The target value to animate toward
 * @param duration   - Animation duration in milliseconds (e.g. 800–1200)
 * @returns The current animated value, updated each frame
 */
export function useAnimatedValue(
  startValue: number,
  endValue: number,
  duration: number
): number {
  const [currentValue, setCurrentValue] = useState<number>(startValue);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset to startValue immediately when endValue changes
    setCurrentValue(startValue);
    startTimeRef.current = null;

    // Cancel any in-flight animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const range = endValue - startValue;

    // Nothing to animate if range is zero or duration is non-positive
    if (range === 0 || duration <= 0) {
      setCurrentValue(endValue);
      return;
    }

    const step = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: decelerates toward the end for a natural feel
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startValue + range * eased;

      setCurrentValue(next);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // Snap to exact end value to avoid floating-point drift
        setCurrentValue(endValue);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [startValue, endValue, duration]);

  return currentValue;
}
