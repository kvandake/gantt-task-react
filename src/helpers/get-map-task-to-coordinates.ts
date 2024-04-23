import {
  Distances,
  MapTaskToCoordinates,
  Task,
  TaskCoordinates,
  RenderTask,
  TaskToRowIndexMap,
  ViewMode,
  TaskComparisonDatesCoordinates,
} from "../types";

import {
  progressWithByParams,
  taskComparisonXCoordinate,
  taskXCoordinate,
} from "./bar-helper";

export const countTaskCoordinates = (
  task: Task,
  taskToRowIndexMap: TaskToRowIndexMap,
  startDate: Date,
  viewMode: ViewMode,
  rtl: boolean,
  fullRowHeight: number,
  taskHeight: number,
  taskYOffset: number,
  distances: Distances,
  svgWidth: number
): TaskCoordinates => {
  const { columnWidth, rowHeight, barComparisonTaskHeight } = distances;

  const { id, comparisonLevel = 1, progress, type } = task;

  const indexesAtLevel = taskToRowIndexMap.get(comparisonLevel);

  if (!indexesAtLevel) {
    throw new Error(`Indexes at level ${comparisonLevel} are not found`);
  }

  const rowIndex = indexesAtLevel.get(id);

  if (typeof rowIndex !== "number") {
    throw new Error(`Row index for task ${id} is not found`);
  }

  const x1 = rtl
    ? svgWidth - taskXCoordinate(task.end, startDate, viewMode, columnWidth)
    : taskXCoordinate(task.start, startDate, viewMode, columnWidth);

  const x2 = rtl
    ? svgWidth - taskXCoordinate(task.start, startDate, viewMode, columnWidth)
    : taskXCoordinate(task.end, startDate, viewMode, columnWidth);

  const levelY = rowIndex * fullRowHeight + rowHeight * (comparisonLevel - 1);

  const y = levelY + taskYOffset;

  const [progressWidth, progressX] =
    type === "milestone"
      ? [0, x1]
      : progressWithByParams(x1, x2, progress, rtl);

  const taskX1 = type === "milestone" ? x1 - taskHeight * 0.5 : x1;

  const taskX2 = type === "milestone" ? x2 + taskHeight * 0.5 : x2;

  const taskWidth =
    type === "milestone" ? taskHeight : Math.max(taskX2 - taskX1, 10);

  const containerX = taskX1 - columnWidth;
  const containerWidth = svgWidth - containerX;

  const innerX1 = columnWidth;
  const innerX2 = columnWidth + taskWidth;

  let comparisonDates: TaskComparisonDatesCoordinates;
  if (task.comparisonDates) {
    const cx1 = rtl
      ? svgWidth -
        taskComparisonXCoordinate(
          task.comparisonDates.end,
          startDate,
          viewMode,
          columnWidth
        )
      : taskComparisonXCoordinate(
          task.comparisonDates.start,
          startDate,
          viewMode,
          columnWidth
        );

    const cx2 = rtl
      ? svgWidth -
        taskComparisonXCoordinate(
          task.comparisonDates.start,
          startDate,
          viewMode,
          columnWidth
        )
      : taskComparisonXCoordinate(
          task.comparisonDates.end,
          startDate,
          viewMode,
          columnWidth
        );

    comparisonDates = {
      x: cx1,
      y: y + taskHeight,
      width: Math.max(cx2 - cx1, 0),
      height: barComparisonTaskHeight,
    };
  }

  return {
    containerWidth,
    containerX,
    innerX1,
    innerX2,
    levelY,
    progressWidth,
    progressX,
    width: taskWidth,
    x1: taskX1,
    x2: taskX2,
    y,
    comparisonDates,
  };
};

export const getMapTaskToCoordinates = (
  tasks: readonly RenderTask[],
  visibleTasksMirror: Readonly<Record<string, true>>,
  taskToRowIndexMap: TaskToRowIndexMap,
  startDate: Date,
  viewMode: ViewMode,
  rtl: boolean,
  fullRowHeight: number,
  taskHeight: number,
  taskYOffset: number,
  distances: Distances,
  svgWidth: number
): MapTaskToCoordinates => {
  const res = new Map<number, Map<string, TaskCoordinates>>();

  tasks.forEach(task => {
    if (task.type === "empty") {
      return;
    }

    const { id, comparisonLevel = 1 } = task;

    if (!visibleTasksMirror[id]) {
      return;
    }

    const taskCoordinates = countTaskCoordinates(
      task,
      taskToRowIndexMap,
      startDate,
      viewMode,
      rtl,
      fullRowHeight,
      taskHeight,
      taskYOffset,
      distances,
      svgWidth
    );

    const resByLevel =
      res.get(comparisonLevel) || new Map<string, TaskCoordinates>();
    resByLevel.set(id, taskCoordinates);
    res.set(comparisonLevel, resByLevel);
  });

  return res;
};
