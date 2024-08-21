import type { ComponentType, ReactNode } from "react";

import { GanttPartialTheme } from "./theme-types";
import { GanttLocale } from "./theme-locale";
import {
  ChildByLevelMap,
  DateSetup,
  Distances,
  RelationMoveTarget,
  RootMapByLevel,
  Task,
  TaskBarMoveAction,
  RenderTask,
  ViewMode,
  TaskId,
} from "./common-types";

export interface GanttRefProps {
  scrollToFirstSelectedTask: () => void;
}

export type RenderTopHeader = (
  date: Date,
  viewMode: ViewMode,
  dateSetup: DateSetup
) => ReactNode;

export type RenderCustomLabel = (
  task: RenderTask,
  x1: number,
  width: number,
  taskHeight: number,
  arrowIndent: number,
  taskYOffset: number,
  movingAction: TaskBarMoveAction | null,
  viewMode: ViewMode,
  rtl?: boolean
) => ReactNode;

export type RenderBottomHeader = (
  date: Date,
  viewMode: ViewMode,
  dateSetup: DateSetup,
  index: number,
  isUnknownDates: boolean
) => ReactNode;

export type OnArrowDoubleClick = (
  taskFrom: Task,
  taskFromIndex: number,
  taskTo: Task,
  taskToIndex: number
) => void;

export type OnRelationChange = (
  /**
   * Task, from, index
   */
  from: [Task, RelationMoveTarget, number],
  /**
   * Task, to, index
   */
  to: [Task, RelationMoveTarget, number],
  /**
   * One of tasks is descendant of other task
   */
  isOneDescendant: boolean
) => void;

export type OnDateChangeSuggestionType = [
  /**
   * Start date
   */
  Date,
  /**
   * End date
   */
  Date,
  /**
   * Suggested task
   */
  Task,
  /**
   * Index in array of tasks
   */
  number,
];

export type OnChangeTasksAction =
  | {
      type: "add_tasks";
      payload: {
        parent: RenderTask;
        descendants: readonly RenderTask[];
      };
    }
  | {
      type: "date_change";
      payload: {
        taskId: string;
        taskIndex: number;
        start: Date;
        end: Date;
      };
    }
  | {
      type: "delete_relation";
      payload: {
        taskFrom: Task;
        taskFromIndex: number;
        taskTo: Task;
        taskToIndex: number;
      };
    }
  | {
      type: "delete_task";
      payload: {
        tasks: readonly RenderTask[];
        taskIndexes: readonly number[];
      };
    }
  | {
      type: "edit_task";
    }
  | {
      type: "move_task_before";
      payload: {
        task: RenderTask;
        taskForMove: RenderTask;
        taskIndex: number;
        taskForMoveIndex: number;
      };
    }
  | {
      type: "move_task_after";
      payload: {
        task: RenderTask;
        taskForMove: RenderTask;
        taskIndex: number;
        taskForMoveIndex: number;
      };
    }
  | {
      type: "move_task_inside";
      payload: {
        parent: Task;
        childs: readonly RenderTask[];
        dependentTasks: readonly Task[];
        parentIndex: number;
        childIndexes: readonly number[];
      };
    }
  | {
      type: "progress_change";
      payload: {
        task: Task;
      };
    }
  | {
      type: "relation_change";
      payload: {
        /**
         * Task, from, index
         */
        from: [Task, RelationMoveTarget, number];
        /**
         * Task, to, index
         */
        to: [Task, RelationMoveTarget, number];
        /**
         * One of tasks is descendant of other task
         */
        isOneDescendant: boolean;
      };
    }
  | {
      type: "expandState_change";
      payload: {
        changedTask: Task;
      };
    };

export type RelationKind =
  | "startToStart"
  | "startToEnd"
  | "endToStart"
  | "endToEnd";

export type OnCommitTasksResult = boolean | undefined | void;

export type OnCommitTasks = (
  nextTasks: readonly RenderTask[],
  action: OnChangeTasksAction
) => Promise<OnCommitTasksResult> | OnCommitTasksResult;

export interface GanttTaskListProps {
  enableTableListContextMenu?: number;

  contextMenuOptions?: ContextMenuOptionType[];

  /**
   * Allow drag-n-drop of tasks in the table
   */
  allowReorderTask?: AllowReorderTask;

  /**
   * Can resize columns
   */
  canResizeColumns?: boolean;

  /**
   *  Custom icons
   */
  icons?: Partial<GanttRenderIconsProps>;

  /**
   * Show numbers of tasks next to tasks
   */
  isShowTaskNumbers?: boolean;

  /**
   * Can reorder tasks
   */
  canReorderTasks?: boolean;

  /**
   * Can reorder tasks
   */
  onResizeColumn?: OnResizeColumn;

  /**
   * Render bottom table content
   */
  tableBottom?: TableRenderBottomProps;
}

export interface TableRenderBottomProps {
  height?: number;
  renderContent?: () => ReactNode;
}

export interface GanttTaskBarProps extends GanttTaskBarActions {
  /**
   * Render function of bottom part of header above chart
   */
  renderBottomHeader?: RenderBottomHeader;
  /**
   * Render function of top part of header above chart
   */
  renderTopHeader?: RenderTopHeader;

  /**
   * Render custom label
   */
  renderCustomLabel?: RenderCustomLabel;

  /**
   * Show critical path
   */
  isShowCriticalPath?: boolean;
  isProgressChangeable?: (task: Task) => boolean;
  isRelationChangeable?: (task: Task) => boolean;
  isDateChangeable?: (task: Task) => boolean;
  isDeleteDependencyOnDoubleClick?: boolean;
  preStepsCount?: number;

  TooltipContent?: ComponentType<{ task: Task }>;

  /**
   * Invokes on double-click on the relation arrow between tasks
   */
  onArrowDoubleClick?: OnArrowDoubleClick;

  /**
   * Invokes on bar double click.
   */
  onDoubleClick?: (task: Task) => void;
  /**
   * Invokes on bar click.
   */
  onClick?: (task: RenderTask) => void;
}

export interface GanttRenderIconsProps {
  renderAddIcon: () => ReactNode;
  renderDragIndicatorIcon: () => ReactNode;
  renderClosedIcon: () => ReactNode;
  renderDeleteIcon: () => ReactNode;
  renderEditIcon: () => ReactNode;
  renderOpenedIcon: () => ReactNode;
  renderNoChildrenIcon: () => ReactNode;
}

export type InsertTaskPosition = "before" | "inside" | "after";
export type AllowReorderTask = (
  task: RenderTask,
  method: InsertTaskPosition
) => boolean;

export type CheckIsHoliday = (
  date: Date,
  minTaskDate: Date,
  dateSetup: DateSetup
) => boolean;

export interface GanttProps {
  /**
   * Theme
   */
  theme?: GanttPartialTheme;

  /**
   * Locale
   */
  locale?: GanttLocale;

  /**
   * Check is current date holiday
   * @param date the date
   * @param minTaskDate lower date of all tasks
   * @param dateSetup
   * @returns
   */
  checkIsHoliday?: CheckIsHoliday;

  /**
   * Can be used to compare multiple graphs. This prop is the number of graps being compared
   */
  comparisonLevels?: number;

  /**
   * Get new id for task after using copy-paste
   */
  getCopiedTaskId?: GetCopiedTaskId;

  /**
   *  Tasks
   */
  tasks: readonly RenderTask[];

  /**
   * Columns of the table
   */
  columns?: readonly Column[];

  /**
   * Round end date of task after move or resize
   * @param date Date after move
   * @param viewMode current date unit
   * @returns next date
   */
  roundEndDate?: (date: Date, viewMode: ViewMode) => Date;

  /**
   * Round start date of task after move or resize
   * @param date Date after move
   * @param viewMode current date unit
   * @returns next date
   */
  roundStartDate?: (date: Date, viewMode: ViewMode) => Date;

  /**
   * View mode
   */
  viewMode?: ViewMode;

  /**
   * View date
   */
  viewDate?: Date;

  /**
   * Task bar options
   */
  taskBar?: GanttTaskBarProps;

  /**
   * Task list options
   */
  taskList?: GanttTaskListProps;

  /**
   * Authorized relations between tasks
   */
  authorizedRelations?: RelationKind[];

  /**
   * Time step value for date changes.
   */
  timeStep?: number;

  /**
   * Invokes on every commit of the list of tasks
   */
  onCommitTasks?: OnCommitTasks;

  /**
   * Callback for getting data of the added task
   */
  onAddTaskAction?: (task: Task | null) => Promise<RenderTask | null>;

  /**
   * Callback for getting new data of the edited task
   */
  onEditTaskAction?: (task: RenderTask) => Promise<RenderTask | null>;

  /**
   * Callback for select task
   */
  onSelectTaskIds?: (taskIds: TaskId[]) => void;

  /**
   * Invokes on wheel event
   * @param wheelEvent
   */
  onWheel?: (wheelEvent: WheelEvent) => void;

  /**
   * Recount descedents of a group task when moving
   */
  isMoveChildsWithParent?: boolean;

  /**
   * Recount parents of tasks in callback `onCommitTasks`
   */
  isUpdateDisabledParentsOnChange?: boolean;

  /**
   * Display offsets from start on timeline instead of dates
   */
  isUnknownDates?: boolean;

  /**
   * Move dates of tasks to working days during change
   */
  isAdjustToWorkingDates?: boolean;
}

export interface GanttTaskBarActions {
  allowMoveTaskBar?: (action: TaskBarMoveAction, task: RenderTask) => boolean;
}

export type ColumnData = {
  dateSetup: DateSetup;
  depth: number;
  dependencies: Task[];
  distances: Distances;
  handleAddTask: (task: Task) => void;
  handleDeleteTasks: (task: RenderTask[]) => void;
  handleEditTask: (task: RenderTask) => void;
  hasChildren: boolean;
  icons?: Partial<GanttRenderIconsProps>;
  indexStr: string;
  isClosed: boolean;
  isShowTaskNumbers: boolean;
  onExpanderClick: (task: Task) => void;
  task: RenderTask;
};

export type ColumnProps = {
  data: ColumnData;
};

export type Column = {
  id: string;
  component: ComponentType<ColumnProps>;
  width: number;
  title?: ReactNode;
  canResize?: boolean;
};

export type OnResizeColumn = (
  nextColumns: readonly Column[],
  columnIndex: number,
  deltaWidth: number
) => void;
export type ChangeAction =
  | {
      type: "add-childs";
      parent: Task;
      // comparison level -> task id
      addedIdsMap: Map<number, Set<string>>;
      addedChildsByLevelMap: ChildByLevelMap;
      addedRootsByLevelMap: RootMapByLevel;
      descendants: readonly RenderTask[];
    }
  | {
      type: "change";
      task: RenderTask;
    }
  | {
      type: "change_start_and_end";
      task: Task;
      changedTask: Task;
      originalTask: Task;
    }
  | {
      type: "delete";
      tasks: readonly RenderTask[];
      // comparison level -> task id
      deletedIdsMap: Map<number, Set<string>>;
    }
  | {
      type: "move-before";
      target: RenderTask;
      taskForMove: RenderTask;
    }
  | {
      type: "move-after";
      target: RenderTask;
      taskForMove: RenderTask;
    }
  | {
      type: "move-inside";
      parent: Task;
      childs: readonly RenderTask[];
      // comparison level -> task id
      movedIdsMap: Map<number, Set<string>>;
    };

export type ChangeMetadata = [
  /**
   * dependent tasks
   */
  Task[],
  /**
   * indexes in list of tasks
   */
  Array<{
    task: RenderTask;
    index: number;
  }>,
  /**
   * array of parents of the task
   */
  Task[],
  /**
   * array of suggesgions for change parent
   */
  OnDateChangeSuggestionType[],
];

export type ContextMenuType = {
  task: RenderTask | null;
  x: number;
  y: number;
};

export type ActionMetaType = {
  /**
   * Check is task id exists at current level (1 by default)
   */
  checkTaskIdExists: CheckTaskIdExistsAtLevel;
  /**
   * Copy all selected tasks
   */
  copySelectedTasks: () => void;
  /**
   * Copy single task
   * @param task the task
   */
  copyTask: (task: RenderTask) => void;
  /**
   * Cut all selected tasks
   */
  cutSelectedTasks: () => void;
  /**
   * Cut single task
   * @param task the task
   */
  cutTask: (task: RenderTask) => void;
  /**
   * @returns List of parent tasks under copy action
   */
  getCopyParentTasks: () => readonly RenderTask[];
  /**
   * @returns List of tasks under copy action
   */
  getCopyTasks: () => readonly RenderTask[];
  /**
   * @returns List of tasks with all their descendants under copy action
   */
  getCopyTasksWithDescendants: () => readonly RenderTask[];
  /**
   * @returns List of parent tasks under cut action
   */
  getCutParentTasks: () => readonly RenderTask[];
  /**
   * @returns List of tasks under cut action
   */
  getCutTasks: () => readonly RenderTask[];
  /**
   * @returns List of parent tasks
   */
  getParentTasks: () => readonly RenderTask[];
  /**
   * @returns List of selected tasks
   */
  getSelectedTasks: () => readonly RenderTask[];
  /**
   * @returns List of tasks with all their descendants
   */
  getTasksWithDescendants: () => readonly RenderTask[];
  /**
   * Add childs to the container task
   * @param parent the container task
   * @param descendants list of added childs with their descendants
   */
  handleAddChilds: (parent: Task, descendants: readonly RenderTask[]) => void;
  /**
   * Delete tasks
   * @param tasksForDelete list of tasks for delete
   */
  handleDeleteTasks: (tasksForDelete: readonly RenderTask[]) => void;

  /**
   * Edit task
   */
  handleEditTask: (task: RenderTask) => void;

  /**
   * Move tasks to the container task
   * @param parent the container task
   * @param childs list of moved tasks
   */
  handleMoveTasksInside: (parent: Task, childs: readonly RenderTask[]) => void;
  /**
   * Make copies of the list of tasks
   */
  makeCopies: (tasks: readonly RenderTask[]) => readonly RenderTask[];
  /**
   * Reset selection
   */
  resetSelectedTasks: () => void;
  /**
   * Task that triggered context menu
   */
  task: RenderTask;
};

export type CheckIsAvailableMetaType = {
  /**
   *
   * @returns Check are there tasks under the copy action
   */
  checkHasCopyTasks: () => boolean;
  /**
   *
   * @returns Check are there tasks under the cut action
   */
  checkHasCutTasks: () => boolean;
  /**
   * Context menu trigger task
   */
  task: RenderTask;
};

export type ContextMenuOptionType = {
  /**
   * Invokes on click on menu option
   * @param meta Metadata for the action
   */
  action: (meta: ActionMetaType) => void;
  /**
   * Check is the current action available. Available by default
   * @param meta Metadata for checking
   */
  checkIsAvailable?: (meta: CheckIsAvailableMetaType) => void;
  label: ReactNode;
  icon?: ReactNode;
};

export type CheckTaskIdExistsAtLevel = (
  newId: string,
  comparisonLevel?: number
) => boolean;

export type GetCopiedTaskId = (
  task: RenderTask,
  checkExists: (newId: string) => boolean
) => string;

export type AdjustTaskToWorkingDatesParams = {
  action: TaskBarMoveAction;
  changedTask: Task;
  originalTask: Task;
};
