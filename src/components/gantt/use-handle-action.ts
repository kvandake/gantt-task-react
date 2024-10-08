import { useCallback } from "react";

import { getParentTasks } from "../../selected-tasks/get-parent-tasks";
import { getSelectedTasks } from "../../selected-tasks/get-selected-tasks";

import type {
  ActionMetaType,
  CheckTaskIdExistsAtLevel,
  ChildByLevelMap,
  Task,
  TaskMapByLevel,
  RenderTask,
} from "../../types";
import { getTasksWithDescendants } from "../../selected-tasks/get-tasks-with-descendants";

const createGetters = (
  mirror: Readonly<Record<string, true>>,
  tasksMap: TaskMapByLevel,
  childTasksMap: ChildByLevelMap
) => {
  let selectedTasks: RenderTask[] | null = null;
  let parentTasks: RenderTask[] | null = null;
  let tasksWithDescendants: RenderTask[] | null = null;

  const getSelectedTasksWithCache = () => {
    if (selectedTasks) {
      return selectedTasks;
    }

    selectedTasks = getSelectedTasks(mirror, tasksMap);

    return selectedTasks;
  };

  const getParentTasksWithCache = () => {
    if (parentTasks) {
      return parentTasks;
    }

    const selectedTasksRes = getSelectedTasksWithCache();

    parentTasks = getParentTasks(selectedTasksRes, tasksMap);

    return parentTasks;
  };

  const getTasksWithDescendantsWithCache = () => {
    if (tasksWithDescendants) {
      return tasksWithDescendants;
    }

    const parentTasksRes = getParentTasksWithCache();
    tasksWithDescendants = getTasksWithDescendants(
      parentTasksRes,
      childTasksMap
    );

    return tasksWithDescendants;
  };

  return {
    getParentTasksWithCache,
    getSelectedTasksWithCache,
    getTasksWithDescendantsWithCache,
  };
};

type UseHandleActionParams = {
  checkTaskIdExists: CheckTaskIdExistsAtLevel;
  childTasksMap: ChildByLevelMap;
  copyIdsMirror: Readonly<Record<string, true>>;
  copySelectedTasks: () => void;
  copyTask: (task: RenderTask) => void;
  cutIdsMirror: Readonly<Record<string, true>>;
  cutSelectedTasks: () => void;
  cutTask: (task: RenderTask) => void;
  handleAddChilds: (parent: Task, descendants: readonly RenderTask[]) => void;
  handleDeleteTasks: (tasksForDelete: readonly RenderTask[]) => void;
  handleEditTask: (taskForEdit: RenderTask) => void;
  handleMoveTasksInside: (parent: Task, childs: readonly RenderTask[]) => void;
  makeCopies: (tasksForCopy: readonly RenderTask[]) => readonly RenderTask[];
  resetSelectedTasks: () => void;
  selectedIdsMirror: Readonly<Record<string, true>>;
  tasksMap: TaskMapByLevel;
};

export const useHandleAction = ({
  checkTaskIdExists,
  childTasksMap,
  copyIdsMirror,
  copySelectedTasks,
  copyTask,
  cutIdsMirror,
  cutSelectedTasks,
  cutTask,
  handleAddChilds,
  handleDeleteTasks,
  handleMoveTasksInside,
  makeCopies,
  resetSelectedTasks,
  selectedIdsMirror,
  handleEditTask,
  tasksMap,
}: UseHandleActionParams) => {
  const handleAction = useCallback(
    (task: RenderTask, action: (meta: ActionMetaType) => void) => {
      const {
        getParentTasksWithCache,
        getSelectedTasksWithCache,
        getTasksWithDescendantsWithCache,
      } = createGetters(selectedIdsMirror, tasksMap, childTasksMap);

      const {
        getParentTasksWithCache: getCutParentTasksWithCache,
        getSelectedTasksWithCache: getCutTasksWithCache,
      } = createGetters(cutIdsMirror, tasksMap, childTasksMap);

      const {
        getParentTasksWithCache: getCopyParentTasksWithCache,
        getSelectedTasksWithCache: getCopyTasksWithCache,
        getTasksWithDescendantsWithCache: getCopyTasksWithDescendantsWithCache,
      } = createGetters(copyIdsMirror, tasksMap, childTasksMap);

      action({
        checkTaskIdExists,
        copySelectedTasks,
        copyTask,
        cutSelectedTasks,
        cutTask,
        getCopyParentTasks: getCopyTasksWithCache,
        getCopyTasks: getCopyParentTasksWithCache,
        getCopyTasksWithDescendants: getCopyTasksWithDescendantsWithCache,
        getCutParentTasks: getCutParentTasksWithCache,
        getCutTasks: getCutTasksWithCache,
        getParentTasks: getParentTasksWithCache,
        getSelectedTasks: getSelectedTasksWithCache,
        getTasksWithDescendants: getTasksWithDescendantsWithCache,
        handleAddChilds,
        handleDeleteTasks,
        handleMoveTasksInside,
        makeCopies,
        resetSelectedTasks,
        handleEditTask,
        task,
      });
    },
    [
      checkTaskIdExists,
      childTasksMap,
      copyIdsMirror,
      copySelectedTasks,
      copyTask,
      cutIdsMirror,
      cutSelectedTasks,
      cutTask,
      handleAddChilds,
      handleDeleteTasks,
      handleEditTask,
      handleMoveTasksInside,
      makeCopies,
      resetSelectedTasks,
      selectedIdsMirror,
      tasksMap,
    ]
  );

  return handleAction;
};
