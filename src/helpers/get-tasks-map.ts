import { TaskMapByLevel, RenderTask } from "../types";

/**
 * @param tasks List of tasks
 */
export const getTasksMap = (tasks: readonly RenderTask[]): TaskMapByLevel => {
  const res = new Map<number, Map<string, RenderTask>>();

  tasks.forEach(task => {
    const { comparisonLevel = 1, id } = task;

    const tasksByLevel =
      res.get(comparisonLevel) || new Map<string, RenderTask>();
    tasksByLevel.set(id, task);

    res.set(comparisonLevel, tasksByLevel);
  });

  return res;
};
