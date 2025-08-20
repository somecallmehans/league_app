import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export default function useMonthYear() {
  const [searchParams, setSearchParams] = useSearchParams();

  const today = new Date();
  const m = today.getMonth() + 1;
  const y = today.getFullYear().toString().substr(-2);
  const mm_yy = `${m < 10 ? "0" : ""}${m}-${y}`;

  const selectedMonth = searchParams.get("m") ?? mm_yy;

  const [month, year] = useMemo(() => {
    const [m, y] = selectedMonth.split("-").map(Number);
    return [m, y];
  }, [selectedMonth]);

  const setSelectedMonth = (val) => {
    const next = new URLSearchParams(searchParams);
    next.set("m", val);
    setSearchParams(next, { replace: true });
  };

  return { selectedMonth, setSelectedMonth, month, year };
}
