import type { TaskMapByLevel, RenderTask } from "../types";

export const getSelectedTasks = (
  selectedIdsMirror: Readonly<Record<string, true>>,
  tasksMap: TaskMapByLevel
) => {
  const res: RenderTask[] = [];

  const tasksAtFirstLevel = tasksMap.get(1);

  if (tasksAtFirstLevel) {
    Object.keys(selectedIdsMirror).forEach(taskId => {
      const task = tasksAtFirstLevel.get(taskId);

      if (task) {
        res.push(task);
      }
    });
  }

  return res;
};
