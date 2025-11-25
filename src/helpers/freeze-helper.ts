import { FrozenDateRange, ViewMode } from "../types";
import { getDatesDiff } from "./get-dates-diff";
import { getDateByOffset } from "./get-date-by-offset";

export interface FreezeSegment {
  start: Date;
  end: Date;
  x: number;
  width: number;
}

export const buildFreezeSegments = ({
  frozenDates,
  startDate,
  viewMode,
  columnWidth,
  datesLength,
  calculateSegments = true,
}: {
  frozenDates: readonly FrozenDateRange[];
  startDate: Date;
  viewMode: ViewMode;
  columnWidth: number;
  datesLength: number;
  calculateSegments?: boolean;
}): FreezeSegment[] => {
  if (!frozenDates.length) {
    return [];
  }

  const timelineEnd = getDateByOffset(startDate, datesLength, viewMode);
  const sortedRanges = [...frozenDates]
    .map(({ start, end }) => ({
      start: new Date(start),
      end: new Date(end),
    }))
    .filter(({ start, end }) => start < end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const mergedRanges: Array<{ start: Date; end: Date }> = [];

  sortedRanges.forEach(range => {
    if (!calculateSegments) {
      mergedRanges.push(range);
      return;
    }

    const last = mergedRanges[mergedRanges.length - 1];

    if (!last) {
      mergedRanges.push(range);
      return;
    }

    if (last.end >= range.start) {
      last.end = new Date(Math.max(last.end.getTime(), range.end.getTime()));
      return;
    }

    mergedRanges.push(range);
  });

  return mergedRanges
    .map(range => {
      const clampedStart =
        range.start < startDate ? startDate : new Date(range.start);
      const clampedEnd =
        range.end > timelineEnd ? timelineEnd : new Date(range.end);

      const startIndex = Math.max(
        0,
        getDatesDiff(clampedStart, startDate, viewMode),
      );
      const endIndex = Math.min(
        datesLength,
        getDatesDiff(clampedEnd, startDate, viewMode),
      );

      const width = Math.max((endIndex - startIndex) * columnWidth, columnWidth);

      return {
        start: clampedStart,
        end: clampedEnd,
        x: startIndex * columnWidth,
        width,
      };
    })
    .filter(segment => segment.width > 0);
};

