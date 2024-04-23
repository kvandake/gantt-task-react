import { checkIsDescendant } from "../helpers/check-is-descendant";

import type { TaskMapByLevel, RenderTask } from "../types";

export const getParentTasks = (
  selectedTasks: RenderTask[],
  tasksMap: TaskMapByLevel
) => {
  const res: RenderTask[] = [];

  selectedTasks.forEach(maybeDescendant => {
    const isDescendant = selectedTasks.some(maybeParent => {
      if (maybeParent === maybeDescendant || maybeParent.type === "empty") {
        return false;
      }

      return checkIsDescendant(maybeParent, maybeDescendant, tasksMap);
    });

    if (!isDescendant) {
      res.push(maybeDescendant);
    }
  });

  return res;
};
