import { RefObject, useCallback, useEffect, useState } from "react";

import { SCROLL_STEP } from "../../constants";

import { handleTaskBySVGMouseEvent } from "../../helpers/bar-helper";

import { getTaskCoordinates } from "../../helpers/get-task-coordinates";
import { roundTaskDates } from "../../helpers/round-task-dates";
import {
  ChangeInProgress,
  ChildByLevelMap,
  DependentMap,
  MapTaskToCoordinates,
  Task,
  TaskBarMoveAction,
  TaskCoordinates,
  TaskMapByLevel,
  TaskToGlobalIndexMap,
} from "../../types";

const SCROLL_DELAY = 25;
const SIDE_SCROLL_AREA_WIDTH = 70;

const getNextCoordinates = (
  task: Task,
  prevValue: ChangeInProgress,
  nextX: number,
  rtl: boolean,
): [TaskCoordinates, number] => {
  const { action, additionalLeftSpace, initialCoordinates, startX } = prevValue;

  switch (action) {
    case "end": {
      const nextX2 = Math.max(Math.max(nextX, initialCoordinates.x1), 0);
      const x2Diff = nextX2 - initialCoordinates.x2;
      const progressWidth = Math.max(
        (nextX2 - initialCoordinates.x1) * task.progress * 0.01,
        0,
      );

      if (rtl) {
        return [
          {
            ...prevValue.coordinates,
            innerX2: nextX2 + additionalLeftSpace,
            progressWidth,
            progressX: initialCoordinates.progressX + x2Diff,
            width: Math.min(initialCoordinates.width + x2Diff, 1),
            x2: nextX2 - additionalLeftSpace,
          },
          x2Diff,
        ];
      }

      return [
        {
          ...prevValue.coordinates,
          innerX2: nextX2 + additionalLeftSpace,
          progressWidth,
          width: Math.min(initialCoordinates.width + x2Diff, 1),
          x2: nextX2 - additionalLeftSpace,
        },
        x2Diff,
      ];
    }

    case "start": {
      const nextX1 = Math.max(Math.min(nextX, initialCoordinates.x2), 0);
      const x1Diff = nextX1 - initialCoordinates.x1;
      const progressWidth = Math.max(
        (initialCoordinates.x2 - nextX1) * task.progress * 0.01,
        0,
      );

      if (rtl) {
        return [
          {
            ...prevValue.coordinates,
            innerX1: nextX1 + additionalLeftSpace,
            progressWidth,
            progressX: initialCoordinates.progressX - x1Diff,
            width: Math.min(initialCoordinates.width - x1Diff, 1),
            x1: nextX1,
          },
          x1Diff,
        ];
      }

      return [
        {
          ...prevValue.coordinates,
          innerX1: nextX1 + additionalLeftSpace,
          progressX: nextX1,
          progressWidth,
          width: Math.min(initialCoordinates.width - x1Diff, 1),
          x1: nextX1,
        },
        x1Diff,
      ];
    }

    case "progress": {
      const nextProgressEndX = Math.min(
        Math.max(nextX, initialCoordinates.x1),
        initialCoordinates.x2,
      );

      if (rtl) {
        return [
          {
            ...prevValue.coordinates,
            progressX: nextProgressEndX,
            progressWidth: initialCoordinates.x2 - nextProgressEndX,
          },
          0,
        ];
      }

      return [
        {
          ...prevValue.coordinates,
          progressWidth: nextProgressEndX - initialCoordinates.x1,
        },
        0,
      ];
    }

    case "move": {
      const diff = nextX - startX;

      const nextX1 = initialCoordinates.x1 + diff;
      const nextX2 = initialCoordinates.x2 + diff;

      return [
        {
          ...prevValue.coordinates,
          innerX1: nextX1 + additionalLeftSpace,
          innerX2: nextX2 + additionalLeftSpace,
          progressX: initialCoordinates.progressX + diff,
          x1: nextX1,
          x2: nextX2,
        },
        diff,
      ];
    }

    default:
      return [prevValue.coordinates, prevValue.coordinatesDiff];
  }
};

const getNextTsDiff = (
  changedTask: Task,
  prevValue: ChangeInProgress,
  rtl: boolean,
): number => {
  const { action, task } = prevValue;

  switch (action) {
    case "end":
      if (rtl) {
        return changedTask.start.getTime() - task.start.getTime();
      }

      return changedTask.end.getTime() - task.end.getTime();

    case "start":
      if (rtl) {
        return changedTask.end.getTime() - task.end.getTime();
      }

      return changedTask.start.getTime() - task.start.getTime();

    case "progress":
      return 0;

    case "move":
      return changedTask.start.getTime() - task.start.getTime();

    default:
      return prevValue.tsDiff;
  }
};

type UseTaskDragParams = {
  childTasksMap: ChildByLevelMap;
  dependentMap: DependentMap;
  ganttSVGRef: RefObject<SVGSVGElement>;
  mapTaskToCoordinates: MapTaskToCoordinates;
  mapTaskToGlobalIndex: TaskToGlobalIndexMap;
  onDateChange: (
    action: TaskBarMoveAction,
    changedTask: Task,
    originalTask: Task,
  ) => void;
  onProgressChange: (task: Task) => void;
  roundEndDate: (date: Date) => Date;
  roundStartDate: (date: Date) => Date;
  rtl: boolean;
  scrollToLeftStep: () => void;
  scrollToRightStep: () => void;
  scrollX: number;
  setScrollXProgrammatically: (nextScrollX: number) => void;
  svgClientWidth: number | null;
  svgWidth: number;
  tasksMap: TaskMapByLevel;
  timeStep: number;
  xStep: number;
};

export const useTaskDrag = ({
                              ganttSVGRef,
                              mapTaskToCoordinates,
                              onDateChange,
                              onProgressChange,
                              roundEndDate,
                              roundStartDate,
                              rtl,
                              scrollToLeftStep,
                              scrollToRightStep,
                              scrollX,
                              setScrollXProgrammatically,
                              svgClientWidth,
                              svgWidth,
                              timeStep,
                              xStep,
                            }: UseTaskDragParams): [
    ChangeInProgress | null,
  (
    action: TaskBarMoveAction,
    task: Task,
    clientX: number,
    taskRootNode: Element,
  ) => void,
] => {
  const [changeInProgress, setChangeInProgress] =
    useState<ChangeInProgress | null>(null);

  // const isChangeInProgress = Boolean(changeInProgress);

  /**
   * Method is Start point of task change
   */
  const handleTaskDragStart = useCallback(
    (
      action: TaskBarMoveAction,
      task: Task,
      clientX: number,
      taskRootNode: Element,
    ) => {
      if (changeInProgress) {
        return;
      }

      const svgNode = ganttSVGRef.current;

      if (!svgNode) {
        return;
      }

      const point = svgNode.createSVGPoint();

      point.x = clientX;
      const cursor = point.matrixTransform(svgNode.getScreenCTM()?.inverse());

      const coordinates = getTaskCoordinates(task, mapTaskToCoordinates);

      setChangeInProgress({
        action,
        additionalLeftSpace: 0,
        additionalRightSpace: 0,
        changedTask: task,
        coordinates: {
          ...coordinates,
          containerX: 0,
          containerWidth: svgWidth,
          innerX1: coordinates.x1,
          innerX2: coordinates.x2,
        },
        coordinatesDiff: 0,
        initialCoordinates: coordinates,
        lastClientX: cursor.x,
        startX: cursor.x,
        task,
        taskRootNode,
        tsDiff: 0,
      });
    },
    [changeInProgress, ganttSVGRef, mapTaskToCoordinates, svgWidth],
  );

  const recountOnMove = useCallback(
    (nextX: number) => {
      const changeInProgressLatest = changeInProgress;

      if (!changeInProgressLatest) {
        return;
      }

      const { task, additionalLeftSpace } = changeInProgressLatest;

      setChangeInProgress(prevValue => {
        if (!prevValue) {
          return null;
        }

        const [nextCoordinates, coordinatesDiff] = getNextCoordinates(
          task,
          prevValue,
          nextX - additionalLeftSpace,
          rtl,
        );

        const { changedTask: newChangedTask } = handleTaskBySVGMouseEvent(
          prevValue.action,
          task,
          prevValue.initialCoordinates,
          nextCoordinates,
          xStep,
          timeStep,
          rtl,
        );

        return {
          ...prevValue,
          changedTask: newChangedTask,
          coordinates: nextCoordinates,
          coordinatesDiff,
          lastClientX: nextX,
          tsDiff: getNextTsDiff(newChangedTask, prevValue, rtl),
        };
      });
    },
    [changeInProgress, rtl, timeStep, xStep],
  );

  useEffect(() => {
    if (!changeInProgress) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const currentChangeInProgress = changeInProgress;

      // const scrollX = scrollX;

      if (!currentChangeInProgress || scrollX === null) {
        return;
      }

      const { action, lastClientX } = currentChangeInProgress;

      if (scrollX > lastClientX - SIDE_SCROLL_AREA_WIDTH) {
        switch (action) {
          case "start":
          case "move":
            if (scrollX > 0) {
              recountOnMove(lastClientX - SCROLL_STEP);
              scrollToLeftStep();
            } else {
              setChangeInProgress(prevValue => {
                if (!prevValue) {
                  return null;
                }

                const nextCoordinates: TaskCoordinates = {
                  ...prevValue.coordinates,
                  containerX: prevValue.coordinates.containerX - SCROLL_STEP,
                  containerWidth:
                    prevValue.coordinates.containerWidth + SCROLL_STEP,
                  innerX2:
                    prevValue.action === "start"
                      ? prevValue.coordinates.innerX2 + SCROLL_STEP
                      : prevValue.coordinates.innerX2,
                  progressX: prevValue.coordinates.progressX - SCROLL_STEP,
                  width:
                    prevValue.action === "start"
                      ? prevValue.coordinates.width + SCROLL_STEP
                      : prevValue.coordinates.width,
                  x1: prevValue.coordinates.x1 - SCROLL_STEP,
                  x2:
                    prevValue.action === "move"
                      ? prevValue.coordinates.x2 - SCROLL_STEP
                      : prevValue.coordinates.x2,
                };

                const { changedTask: newChangedTask } =
                  handleTaskBySVGMouseEvent(
                    prevValue.action,
                    prevValue.task,
                    prevValue.initialCoordinates,
                    nextCoordinates,
                    xStep,
                    timeStep,
                    rtl,
                  );

                return {
                  ...prevValue,
                  additionalLeftSpace:
                    prevValue.additionalLeftSpace + SCROLL_STEP,
                  changedTask: newChangedTask,
                  coordinates: nextCoordinates,
                  coordinatesDiff: prevValue.coordinatesDiff - SCROLL_STEP,
                  tsDiff: getNextTsDiff(newChangedTask, prevValue, rtl),
                };
              });
            }
            return;

          case "end":
            if (scrollX > 0) {
              recountOnMove(lastClientX - SCROLL_STEP);
              scrollToLeftStep();
            }
            return;

          default:
            return;
        }
      }

      if (svgClientWidth === null) {
        return;
      }

      if (scrollX + svgClientWidth < lastClientX + SIDE_SCROLL_AREA_WIDTH) {
        switch (action) {
          case "end":
          case "move":
            if (svgWidth > scrollX + svgClientWidth) {
              recountOnMove(lastClientX + SCROLL_STEP);
              scrollToRightStep();
            } else {
              setChangeInProgress(prevValue => {
                if (!prevValue) {
                  return null;
                }

                const nextCoordinates: TaskCoordinates = {
                  ...prevValue.coordinates,
                  containerWidth:
                    prevValue.coordinates.containerWidth + SCROLL_STEP,
                  innerX1:
                    prevValue.action === "move"
                      ? prevValue.coordinates.innerX1 + SCROLL_STEP
                      : prevValue.coordinates.innerX1,
                  innerX2: prevValue.coordinates.innerX2 + SCROLL_STEP,
                  progressX: prevValue.coordinates.progressX + SCROLL_STEP,
                  width:
                    prevValue.action === "end"
                      ? prevValue.coordinates.width + SCROLL_STEP
                      : prevValue.coordinates.width,
                  x1:
                    prevValue.action === "move"
                      ? prevValue.coordinates.x1 + SCROLL_STEP
                      : prevValue.coordinates.x1,
                  x2: prevValue.coordinates.x2 + SCROLL_STEP,
                };

                const { changedTask: newChangedTask } =
                  handleTaskBySVGMouseEvent(
                    prevValue.action,
                    prevValue.task,
                    prevValue.initialCoordinates,
                    nextCoordinates,
                    xStep,
                    timeStep,
                    rtl,
                  );

                return {
                  ...prevValue,
                  additionalRightSpace:
                    prevValue.additionalRightSpace + SCROLL_STEP,
                  changedTask: newChangedTask,
                  coordinates: nextCoordinates,
                  coordinatesDiff: prevValue.coordinatesDiff + SCROLL_STEP,
                  lastClientX: prevValue.lastClientX + SCROLL_STEP,
                  tsDiff: getNextTsDiff(newChangedTask, prevValue, rtl),
                };
              });
            }
            return;

          case "start":
            if (svgWidth > scrollX + svgClientWidth) {
              recountOnMove(lastClientX + SCROLL_STEP);
              scrollToRightStep();
            }
            return;

          default:
            return;
        }
      }
    }, SCROLL_DELAY);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    changeInProgress,
    recountOnMove,
    rtl,
    scrollToLeftStep,
    scrollToRightStep,
    scrollX,
    svgClientWidth,
    svgWidth,
    timeStep,
    xStep,
  ]);

  const additionalRightSpace = changeInProgress?.additionalRightSpace;

  useEffect(() => {
    if (additionalRightSpace) {
      setScrollXProgrammatically((scrollX || 0) + (svgClientWidth || 0));
    }
  }, [
    additionalRightSpace,
    scrollX,
    setScrollXProgrammatically,
    svgClientWidth,
  ]);

  useEffect(() => {
    const svgNode = ganttSVGRef.current;

    const point = svgNode.createSVGPoint();

    const handleMove = (clientX: number) => {
      if (!point) {
        return;
      }

      point.x = clientX;
      const cursor = point.matrixTransform(svgNode.getScreenCTM()?.inverse());

      const nextX = cursor.x;

      recountOnMove(nextX);
    };

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();

      handleMove(event.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();

      const firstTouch = event.touches[0];

      if (firstTouch) {
        handleMove(firstTouch.clientX);
      }
    };

    const handleUp = async (event: Event) => {
      event.preventDefault();
      const changeInProgressLatest = changeInProgress;

      if (!changeInProgressLatest || !point) {
        return;
      }

      const { action, task } = changeInProgressLatest;

      const { isChanged, changedTask: newChangedTask } =
        handleTaskBySVGMouseEvent(
          action,
          task,
          changeInProgressLatest.initialCoordinates,
          changeInProgressLatest.coordinates,
          xStep,
          timeStep,
          rtl,
        );

      setChangeInProgress(null);

      if (!isChanged) {
        return;
      }

      if (action === "progress") {
        onProgressChange(newChangedTask);
        return;
      }

      const roundedChangedTask = roundTaskDates(
        newChangedTask,
        roundStartDate,
        roundEndDate,
      );

      onDateChange(action, roundedChangedTask, task);
    };

    svgNode.addEventListener("mousemove", handleMouseMove);
    svgNode.addEventListener("touchmove", handleTouchMove, { passive: true });
    svgNode.addEventListener("mouseup", handleUp);
    svgNode.addEventListener("touchend", handleUp, { passive: true });

    return () => {
      // TODO тут не up при hover tooltip
      svgNode.removeEventListener("mousemove", handleMouseMove);
      svgNode.removeEventListener("touchmove", handleTouchMove);
      svgNode.removeEventListener("mouseup", handleUp);
      svgNode.removeEventListener("touchend", handleUp);
    };
  }, [changeInProgress, ganttSVGRef, onDateChange, onProgressChange, recountOnMove, roundEndDate, roundStartDate, rtl, timeStep, xStep]);

  return [changeInProgress, handleTaskDragStart];
};
