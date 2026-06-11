"use client";
import { useState, useCallback, useRef } from "react";

export function useProgressSteps() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCompletedSteps([]);
    setActiveStep(0);
  }, []);

  const startProgress = useCallback(() => {
    reset();
    setActiveStep(1);

    // Step 1→2 at 1s
    const t1 = setTimeout(() => {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
      setActiveStep((prev) => Math.max(prev, 2));
    }, 1000);

    // Step 2→3 at 2s
    const t2 = setTimeout(() => {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
      setActiveStep((prev) => Math.max(prev, 3));
    }, 2000);

    // Step 3→4 at 3s
    const t3 = setTimeout(() => {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 3])));
      setActiveStep((prev) => Math.max(prev, 4));
    }, 3000);

    // Step 4 completes at 4s (stays on 4 until real scoring kicks in)
    const t4 = setTimeout(() => {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 4])));
    }, 4000);

    timersRef.current = [t1, t2, t3, t4];
  }, [reset]);

  const completeAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCompletedSteps([1, 2, 3, 4, 5, 6]);
    setActiveStep(7); // past all steps
  }, []);

  const activateStep = useCallback((step: number) => {
    setActiveStep(step);
    // Mark all previous steps complete
    setCompletedSteps((prev) => {
      const newCompleted = [...prev];
      for (let i = 1; i < step; i++) {
        if (!newCompleted.includes(i)) newCompleted.push(i);
      }
      return newCompleted;
    });
  }, []);

  return { completedSteps, activeStep, startProgress, completeAll, activateStep, reset };
}
