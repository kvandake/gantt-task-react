import { useCallback, useMemo } from "react";

import { adjustTaskToWorkingDates as defaultAdjustTaskToWorkingDates } from "../../helpers/adjust-task-to-working-dates";
import { getNextWorkingDate as defaultGetNextWorkingDate } from "../../helpers/get-next-working-date";
import { getPreviousWorkingDate as defaultGetPreviousWorkingDate } from "../../helpers/get-previous-working-date";

import { AdjustTaskToWorkingDatesParams, DateSetup, FrozenDateRange } from "../../types";

type UseHolidaysParams = {
  checkIsHolidayProp: (
    date: Date,
    minTaskDate: Date,
    dateSetup: DateSetup
  ) => boolean;
  dateSetup: DateSetup;
  isAdjustToWorkingDates: boolean;
  minTaskDate: Date;
  frozenDates?: readonly FrozenDateRange[];
  freezeEnabled?: boolean;
};

export const useHolidays = ({
  checkIsHolidayProp,
  dateSetup,
  isAdjustToWorkingDates,
  minTaskDate,
  frozenDates,
  freezeEnabled,
}: UseHolidaysParams) => {
  const frozenRanges = useMemo(
    () =>
      freezeEnabled
        ? (frozenDates ?? []).map(range => ({
            start: range.start.getTime(),
            end: range.end.getTime(),
          }))
        : [],
    [freezeEnabled, frozenDates],
  );

  const checkIsHoliday = useCallback(
    (date: Date) => {
      if (checkIsHolidayProp(date, minTaskDate, dateSetup)) {
        return true;
      }

      if (!frozenRanges.length) {
        return false;
      }

      const time = date.getTime();
      return frozenRanges.some(({ start, end }) => time >= start && time < end);
    },
    [checkIsHolidayProp, dateSetup, frozenRanges, minTaskDate],
  );

  const getNextWorkingDate = useCallback(
    (date: Date) =>
      defaultGetNextWorkingDate(date, checkIsHoliday, dateSetup.viewMode),
    [checkIsHoliday, dateSetup]
  );

  const getPreviousWorkingDate = useCallback(
    (date: Date) =>
      defaultGetPreviousWorkingDate(date, checkIsHoliday, dateSetup.viewMode),
    [checkIsHoliday, dateSetup]
  );

  const adjustTaskToWorkingDates = useCallback(
    ({ action, changedTask, originalTask }: AdjustTaskToWorkingDatesParams) => {
      if (isAdjustToWorkingDates) {
        return defaultAdjustTaskToWorkingDates({
          action,
          changedTask,
          checkIsHoliday,
          getNextWorkingDate,
          getPreviousWorkingDate,
          originalTask,
          viewMode: dateSetup.viewMode,
        });
      }

      return changedTask;
    },
    [
      checkIsHoliday,
      dateSetup,
      getNextWorkingDate,
      getPreviousWorkingDate,
      isAdjustToWorkingDates,
    ]
  );

  return {
    checkIsHoliday,
    adjustTaskToWorkingDates,
  };
};
