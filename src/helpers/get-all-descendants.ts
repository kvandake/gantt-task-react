import type { ChildByLevelMap, Task, RenderTask } from "../types";

const fillDescendantsForTask = <
  IsCollectEmpty extends boolean,
  ResultItem extends Task | RenderTask = IsCollectEmpty extends true
    ? RenderTask
    : Task,
>(
  res: ResultItem[],
  task: Task,
  childTasksAtLevelMap: Map<string, RenderTask[]>,
  isCollectEmpty: IsCollectEmpty
) => {
  const childs = childTasksAtLevelMap.get(task.id);

  if (!childs) {
    return;
  }

  childs.forEach(child => {
    if (child.type === "empty") {
      if (isCollectEmpty) {
        res.push(child as ResultItem);
      }

      return;
    }

    res.push(child as ResultItem);

    fillDescendantsForTask(res, child, childTasksAtLevelMap, isCollectEmpty);
  });
};

export const getAllDescendants = <
  IsCollectEmpty extends boolean,
  ResultItem extends Task | RenderTask = IsCollectEmpty extends true
    ? RenderTask
    : Task,
>(
  task: Task,
  childTasksMap: ChildByLevelMap,
  isCollectEmpty: IsCollectEmpty
): readonly ResultItem[] => {
  const { comparisonLevel = 1 } = task;

  const childTasksAtLevelMap = childTasksMap.get(comparisonLevel);

  if (!childTasksAtLevelMap) {
    return [];
  }

  const res: ResultItem[] = [];

  fillDescendantsForTask(res, task, childTasksAtLevelMap, isCollectEmpty);

  return res;
};
