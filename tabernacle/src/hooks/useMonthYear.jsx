import { useState } from "react";

export default function useMonthYear() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear().toString().substr(-2);
  const mm_yy = `${month < 10 ? "0" : ""}${month}-${year}`;
  const [selectedMonth, setSelectedMonth] = useState(mm_yy);

  return { selectedMonth, setSelectedMonth, month, year };
}
