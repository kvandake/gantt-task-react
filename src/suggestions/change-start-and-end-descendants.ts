import { addMilliseconds, differenceInMilliseconds } from "date-fns";

import type {
  AdjustTaskToWorkingDatesParams,
  OnDateChangeSuggestionType,
  Task,
  RenderTask,
  TaskToGlobalIndexMap,
} from "../types";

type ChangeStartAndEndDescendantsParams = {
  adjustTaskToWorkingDates: (params: AdjustTaskToWorkingDatesParams) => Task;
  changedTask: Task;
  descendants: readonly RenderTask[];
  mapTaskToGlobalIndex: TaskToGlobalIndexMap;
  originalTask: Task;
};

export const changeStartAndEndDescendants = ({
  adjustTaskToWorkingDates,
  changedTask,
  descendants,
  mapTaskToGlobalIndex,
  originalTask,
}: ChangeStartAndEndDescendantsParams): readonly OnDateChangeSuggestionType[] => {
  const diff = differenceInMilliseconds(changedTask.start, originalTask.start);

  const mapTaskToGlobalIndexAtLevel = mapTaskToGlobalIndex.get(
    changedTask.comparisonLevel || 1
  );

  if (!mapTaskToGlobalIndexAtLevel) {
    throw new Error("Tasks are not found in the current level");
  }

  return descendants.reduce<OnDateChangeSuggestionType[]>((res, task) => {
    if (task.type === "empty") {
      return res;
    }

    const index = mapTaskToGlobalIndexAtLevel.get(task.id);

    if (typeof index !== "number") {
      throw new Error("Global index for the task is not found");
    }

    const preChangedTask: Task = {
      ...task,
      end: addMilliseconds(task.end, diff),
      start: addMilliseconds(task.start, diff),
    };

    const adjustedTask = adjustTaskToWorkingDates({
      action: "move",
      changedTask: preChangedTask,
      originalTask: task,
    });

    res.push([adjustedTask.start, adjustedTask.end, task, index]);

    return res;
  }, []);
};
