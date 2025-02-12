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
];

export const monthMap = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  10: "October",
  11: "November",
  12: "December",
};

export function formatMonthYear(mm_yy) {
  const [month, year] = mm_yy.split("-");

  // Convert month to integer and use it to get the correct month name
  const monthName = monthNames[parseInt(month, 10) - 1];

  // Add "20" to the start of the year to convert "24" into "2024"
  const fullYear = `20${year}`;

  return `${monthName} ${fullYear}`;
}

export function formatDateString(dateString) {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = monthNames[date.getMonth()];

  // Helper function to get the day suffix (st, nd, rd, th)
  function getDaySuffix(day) {
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

export const monthStr = (month) => {
  const split = month.split("-");
  return `${monthMap[split[0]]} '${split[1]}`;
};
