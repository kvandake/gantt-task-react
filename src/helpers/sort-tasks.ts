import { RenderTask } from "../types";

export const sortTasks = (taskA: RenderTask, taskB: RenderTask) => {
  const orderA = taskA.displayOrder || Number.MAX_VALUE;
  const orderB = taskB.displayOrder || Number.MAX_VALUE;

  if (orderA > orderB) {
    return 1;
  }

  if (orderA < orderB) {
    return -1;
  }

  return 0;
};
