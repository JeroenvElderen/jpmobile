"use client";

import { useEffect, useMemo, useState } from "react";

function getRemainingParts(targetDate: Date) {
  const totalSeconds = Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function CountdownTimer({ startsAt }: { startsAt: string }) {
  const targetDate = useMemo(() => new Date(startsAt), [startsAt]);
  const [remaining, setRemaining] = useState(() => getRemainingParts(targetDate));

  useEffect(() => {
    const update = () => setRemaining(getRemainingParts(targetDate));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  if (remaining.totalSeconds === 0) {
    return <p className="mt-5 text-4xl font-semibold">It&apos;s time!</p>;
  }

  return (
    <p className="mt-5 font-mono text-4xl font-black tracking-tight sm:text-5xl">
      {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
    </p>
  );
}