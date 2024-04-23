import type { ChildByLevelMap, RenderTask } from "../types";

const fillDescendants = (
  res: RenderTask[],
  task: RenderTask,
  childAtLevelMap: Map<string, RenderTask[]>
) => {
  res.push(task);

  const childs = childAtLevelMap.get(task.id);

  if (!childs) {
    return;
  }

  childs.forEach(childTask => {
    fillDescendants(res, childTask, childAtLevelMap);
  });
};

export const getTasksWithDescendants = (
  parentTasks: RenderTask[],
  childByLevelMap: ChildByLevelMap
) => {
  const res: RenderTask[] = [];

  parentTasks.forEach(task => {
    const { comparisonLevel = 1 } = task;

    if (childByLevelMap?.size) {
      const childAtLevelMap = childByLevelMap.get(comparisonLevel);

      if (!childAtLevelMap) {
        return;
      }

      fillDescendants(res, task, childAtLevelMap);
    } else {
      fillDescendants(res, task, new Map<string, RenderTask[]>());
    }
  });

  return res;
};
