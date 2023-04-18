import addYears from "date-fns/addYears";
import addMonths from "date-fns/addMonths";
import addDays from "date-fns/addDays";
import addHours from "date-fns/addHours";
import subYears from "date-fns/subYears";
import subMonths from "date-fns/subMonths";
import subDays from "date-fns/subDays";
import subHours from "date-fns/subHours";
import subWeeks from "date-fns/subWeeks";
import startOfYear from "date-fns/startOfYear";
import startOfMonth from "date-fns/startOfMonth";
import startOfDay from "date-fns/startOfDay";
import startOfHour from "date-fns/startOfHour";
import startOfWeek from "date-fns/startOfWeek";

import { TaskOrEmpty, ViewMode } from "../types/public-types";
import { getDatesDiff } from "./get-dates-diff";

export const ganttDateRange = (
  tasks: readonly TaskOrEmpty[],
  viewMode: ViewMode,
  preStepsCount: number,
): [
  Date,
  Date,
  number,
] => {
  let minTaskDate: Date | null = null;
  let maxTaskDate: Date | null = null;
  for (const task of tasks) {
    if (task.type !== 'empty') {
      if (!minTaskDate || task.start < minTaskDate) {
        minTaskDate = task.start;
      }

      if (!maxTaskDate || task.end > maxTaskDate) {
        maxTaskDate = task.end;
      }
    }
  }

  if (!minTaskDate || !maxTaskDate) {
    return [new Date(), new Date(), 2];
  }

  let newStartDate: Date | null = null;
  let newEndDate: Date | null = null;

  switch (viewMode) {
    case ViewMode.Year:
      newStartDate = subYears(minTaskDate, preStepsCount);
      newStartDate = startOfYear(newStartDate);
      newEndDate = addYears(maxTaskDate, 1);
      newEndDate = startOfYear(newEndDate);
      break;
    case ViewMode.QuarterYear:
      newStartDate = addToDate(newStartDate, -3, "month");
      newStartDate = startOfDate(newStartDate, "month");
      newEndDate = addToDate(newEndDate, 3, "year");
      newEndDate = startOfDate(newEndDate, "year");
      break;
    case ViewMode.Month:
      newStartDate = subMonths(minTaskDate, preStepsCount);
      newStartDate = startOfMonth(newStartDate);
      newEndDate = addYears(maxTaskDate, 1);
      newEndDate = startOfYear(newEndDate);
      break;
    case ViewMode.Week:
      newStartDate = startOfWeek(minTaskDate);
      newStartDate = subWeeks(newStartDate, preStepsCount);
      newEndDate = startOfDay(maxTaskDate);
      newEndDate = addMonths(newEndDate, 1.5);
      break;
    case ViewMode.Day:
      newStartDate = startOfDay(minTaskDate);
      newStartDate = subDays(newStartDate, preStepsCount);
      newEndDate = startOfDay(maxTaskDate);
      newEndDate = addDays(newEndDate, 19);
      break;
    case ViewMode.QuarterDay:
      newStartDate = startOfDay(minTaskDate);
      newStartDate = subHours(newStartDate, preStepsCount * 6);
      newEndDate = startOfDay(maxTaskDate);
      newEndDate = addHours(newEndDate, 66); // 24(1 day)*3 - 6
      break;
    case ViewMode.HalfDay:
      newStartDate = startOfDay(minTaskDate);
      newStartDate = subHours(newStartDate, preStepsCount * 12);
      newEndDate = startOfDay(maxTaskDate);
      newEndDate = addHours(newEndDate, 108); // 24(1 day)*5 - 12
      break;
    case ViewMode.Hour:
      newStartDate = startOfHour(minTaskDate);
      newStartDate = subHours(newStartDate, preStepsCount);
      newEndDate = startOfDay(maxTaskDate);
      newEndDate = addDays(newEndDate, 1);
      break;
  }
  return [newStartDate, newEndDate];
};

export const seedDates = (
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode
) => {
  let currentDate: Date = new Date(startDate);
  const dates: Date[] = [currentDate];
  while (currentDate < endDate) {
    switch (viewMode) {
      case ViewMode.Year:
        currentDate = addToDate(currentDate, 1, "year");
        break;
      case ViewMode.QuarterYear:
        currentDate = addToDate(currentDate, 3, "month");
        break;
      case ViewMode.Month:
        currentDate = addToDate(currentDate, 1, "month");
        break;
      case ViewMode.Week:
        currentDate = addToDate(currentDate, 7, "day");
        break;
      case ViewMode.Day:
        currentDate = addToDate(currentDate, 1, "day");
        break;
      case ViewMode.HalfDay:
        currentDate = addToDate(currentDate, 12, "hour");
        break;
      case ViewMode.QuarterDay:
        currentDate = addToDate(currentDate, 6, "hour");
        break;
      case ViewMode.Hour:
        currentDate = addToDate(currentDate, 1, "hour");
        break;
    }
    dates.push(currentDate);
  }
  return dates;
};

export const getLocaleMonth = (date: Date, locale: string) => {
  let bottomValue = getCachedDateTimeFormat(locale, {
    month: "long",
  }).format(date);
  bottomValue = bottomValue.replace(
    bottomValue[0],
    bottomValue[0].toLocaleUpperCase()
  );
  return bottomValue;
};

export const getLocalDayOfWeek = (
  date: Date,
  locale: string,
  format?: "long" | "short" | "narrow" | undefined
) => {
  let bottomValue = getCachedDateTimeFormat(locale, {
    weekday: format,
  }).format(date);
  bottomValue = bottomValue.replace(
    bottomValue[0],
    bottomValue[0].toLocaleUpperCase()
  );
  return bottomValue;
};

  return [newStartDate, minTaskDate, getDatesDiff(newEndDate, newStartDate, viewMode)];
};

export const getWeekNumberISO8601 = (date: Date) => {
  const tmpDate = new Date(date.valueOf());
  const dayNumber = (tmpDate.getDay() + 6) % 7;
  tmpDate.setDate(tmpDate.getDate() - dayNumber + 3);
  const firstThursday = tmpDate.valueOf();
  tmpDate.setMonth(0, 1);
  if (tmpDate.getDay() !== 4) {
    tmpDate.setMonth(0, 1 + ((4 - tmpDate.getDay() + 7) % 7));
  }
  const weekNumber = (
    1 + Math.ceil((firstThursday - tmpDate.valueOf()) / 604800000)
  ).toString();

  if (weekNumber.length === 1) {
    return `0${weekNumber}`;
  } else {
    return weekNumber;
  }
};

export const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};
