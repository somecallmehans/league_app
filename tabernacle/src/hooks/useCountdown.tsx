import { useState, useEffect, useRef } from "react";

interface Countdown {
  minutes: number;
  seconds: number | string;
  styles: string;
}

function calculateTimeLeft(target: number | undefined): Countdown | null {
  if (!target) {
    return null;
  }

  const current = new Date();
  const curr_time = Math.floor(current.getTime() / 1000);

  const diff = target - curr_time;

  if (diff <= 0) {
    return { minutes: 0, seconds: "00", styles: "" };
  }

  const minutes = Math.floor((diff / 60) % 60);
  const seconds = Math.floor(diff % 60);

  return {
    minutes,
    seconds: seconds < 10 ? `0${seconds}` : seconds,
    styles: "",
  };
}

export default function useCountdown(target: number | undefined) {
  const [timeLeft, setTimeLeft] = useState<Countdown | null>(null);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(target));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [target]);

  if (!target) {
    return () => (
      <div className="">
        <span>--:--</span>
      </div>
    );
  }

  const styles =
    timeLeft && timeLeft?.minutes < 1 ? "text-red-500" : "text-green-500";

  return () => (
    <div className={`text-4xl ${styles}`}>
      <span>
        {timeLeft?.minutes}:{timeLeft?.seconds}
      </span>
    </div>
  );
}
