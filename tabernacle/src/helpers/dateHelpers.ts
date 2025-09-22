const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthName = (typeof monthNames)[number];
export type MonthNumString =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12";

export const monthMap: Record<MonthNumString, MonthName> = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

export type MonthYear = `${MonthNumString}-${string}`;

export function formatMonthYear(mm_yy: MonthYear): string {
  const [month, year] = mm_yy.split("-") as [MonthNumString, string];

  const monthIndex = parseInt(month, 10) - 1;

  return `${monthNames[monthIndex]} 20${year}`;
}

export function formatDateString(dateString: string): string {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = monthNames[date.getMonth()];

  // Helper function to get the day suffix (st, nd, rd, th)
  function getDaySuffix(day: number): "st" | "nd" | "rd" | "th" {
    if (day > 3 && day < 21) return "th"; // handles 11th to 19th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  return `${month} ${day}${getDaySuffix(day)}`;
}

export const monthStr = (month: MonthYear): string => {
  const [mm, yy] = month.split("-");
  return `${monthMap[mm as MonthNumString]} '${yy}`;
};
