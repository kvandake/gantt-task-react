import { ChildByLevelMap, RootMapByLevel, RenderTask } from "../types";

export const getChildsAndRoots = (
  tasks: readonly RenderTask[],
  checkIsRoot: ((task: RenderTask) => boolean) | null
): [ChildByLevelMap, RootMapByLevel] => {
  const childRes = new Map<number, Map<string, RenderTask[]>>();
  const rootRes = new Map<number, RenderTask[]>();

  tasks.forEach(task => {
    const { parent, comparisonLevel = 1 } = task;

    if (!parent || (checkIsRoot && checkIsRoot(task))) {
      const rootOnLevel = rootRes.get(comparisonLevel) || [];
      rootRes.set(comparisonLevel, [...rootOnLevel, task]);

      return;
    }

    const parentsByLevel =
      childRes.get(comparisonLevel) || new Map<string, RenderTask[]>();
    const prevValue = parentsByLevel.get(parent) || [];

    parentsByLevel.set(parent, [...prevValue, task]);
    childRes.set(comparisonLevel, parentsByLevel);
  });

  return [childRes, rootRes];
};
