export const getCurrentDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDate = (date: string): string => {
  if (!date) return "";

  try {
    // Create date with timezone adjustment to avoid day shift
    const dateParts = date.split("T")[0].split("-");
    if (dateParts.length !== 3) return date;

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2]);

    // Create date using local timezone
    const dateObj = new Date(year, month, day);

    // Format the date as YYYY-MM-DD
    const formattedYear = dateObj.getFullYear();
    const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(dateObj.getDate()).padStart(2, "0");

    return `${formattedYear}-${formattedMonth}-${formattedDay}`;
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return date;
  }
};

export  const getUserInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return "?";
  return `${firstName ? firstName.charAt(0).toUpperCase() : ""}${
    lastName ? lastName.charAt(0).toUpperCase() : ""
  }`;
};

export  const getDateRangeFromWeek = (
  week: number,
  year: number
): { startDate: string; endDate: string } => {
  // Create a date for Jan 1st of the given year
  const januaryFirst = new Date(year, 0, 1);

  // Get the day of the week (0-6, where 0 is Sunday)
  const dayOfWeek = januaryFirst.getDay();

  // Calculate days to add to get to the first day of week 1
  // According to ISO 8601, week 1 is the week with the first Thursday of the year
  // So if Jan 1st is a Friday (5), we need to go back to the previous Monday (-4 days)
  const daysToFirstMonday = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;

  // Start date is the first Monday of week 1, plus 7 days for each additional week
  const startDate = new Date(year, 0, 1 + daysToFirstMonday + (week - 1) * 7);

  // End date is 6 days after start date (for a full week)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};
