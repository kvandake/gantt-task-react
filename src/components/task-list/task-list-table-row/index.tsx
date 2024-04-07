import type { CSSProperties, MouseEvent } from "react";
import { forwardRef, memo, useCallback, useMemo } from "react";

import {
  Column,
  ColumnData,
  DateSetup,
  DependencyMap,
  Distances,
  Icons,
  InsertTaskPosition,
  Task,
  TaskOrEmpty,
} from "../../../types/public-types";

import styles from "./task-list-table-row.module.css";
import { DragIndicatorIcon } from "../../icons/drag-indicator-icon";

export type TaskListTableRowProps = {
  columns: readonly Column[];
  dateSetup: DateSetup;
  dependencyMap: DependencyMap;
  depth: number;
  distances: Distances;
  fullRowHeight: number;
  getTaskCurrentState: (task: Task) => Task;
  handleAddTask: (task: Task) => void;
  handleDeleteTasks: (task: TaskOrEmpty[]) => void;
  handleEditTask: (task: TaskOrEmpty) => void;
  // eslint-disable-next-line
  moveHandleProps?: any;
  moveOverPosition?: InsertTaskPosition;
  handleOpenContextMenu: (
    task: TaskOrEmpty,
    clientX: number,
    clientY: number
  ) => void;
  hasChildren: boolean;
  icons?: Partial<Icons>;
  indexStr: string;
  isDragging?: boolean;
  isOverlay?: boolean;
  isClosed: boolean;
  isCut: boolean;
  isEven: boolean;
  isSelected: boolean;
  isShowTaskNumbers: boolean;
  onClick: (task: TaskOrEmpty) => void;
  onExpanderClick: (task: Task) => void;
  scrollToTask: (task: Task) => void;
  selectTaskOnMouseDown: (taskId: string, event: MouseEvent) => void;
  style?: CSSProperties;
  task: TaskOrEmpty;
};

const TaskListTableRowInner = forwardRef<HTMLDivElement, TaskListTableRowProps>(
  (props, ref) => {
    const {
      columns,
      dateSetup,
      dependencyMap,
      depth,
      distances,
      fullRowHeight,
      getTaskCurrentState,
      handleAddTask,
      handleDeleteTasks,
      handleEditTask,
      handleOpenContextMenu,
      hasChildren,
      icons = undefined,
      indexStr,
      isClosed,
      isCut,
      isEven,
      isSelected,
      isShowTaskNumbers,
      onClick,
      onExpanderClick,
      scrollToTask,
      selectTaskOnMouseDown,
      style = undefined,
      task,
      moveHandleProps,
      isOverlay,
      // isDragging,
      moveOverPosition,
    } = props;
    const { id, comparisonLevel = 1 } = task;

    const onRootMouseDown = useCallback(
      (event: MouseEvent) => {
        // event.preventDefault();
        if (event.button !== 0) {
          return;
        }

        if (task.type !== "empty") {
          scrollToTask(task);
        }

        selectTaskOnMouseDown(task.id, event);
        if (onClick) {
          onClick(task);
        }
      },
      [onClick, scrollToTask, selectTaskOnMouseDown, task]
    );

    const onContextMenu = useCallback(
      (event: MouseEvent) => {
        event.preventDefault();
        if (event.ctrlKey) {
          return;
        }
        handleOpenContextMenu(task, event.clientX, event.clientY);
      },
      [handleOpenContextMenu, task]
    );

    const dependencies = useMemo<Task[]>(() => {
      const dependenciesAtLevel = dependencyMap.get(comparisonLevel);

      if (!dependenciesAtLevel) {
        return [];
      }

      const dependenciesByTask = dependenciesAtLevel.get(id);

      if (!dependenciesByTask) {
        return [];
      }

      return dependenciesByTask.map(({ source }) => source);
    }, [comparisonLevel, dependencyMap, id]);

    const columnData: ColumnData = useMemo(
      () => ({
        dateSetup,
        dependencies,
        depth,
        distances,
        handleDeleteTasks,
        handleAddTask,
        handleEditTask,
        hasChildren,
        icons,
        indexStr,
        isClosed,
        isShowTaskNumbers,
        onExpanderClick,
        task: task.type === "empty" ? task : getTaskCurrentState(task),
      }),
      [
        dateSetup,
        dependencies,
        depth,
        distances,
        getTaskCurrentState,
        handleDeleteTasks,
        handleAddTask,
        handleEditTask,
        hasChildren,
        icons,
        indexStr,
        isClosed,
        isShowTaskNumbers,
        onExpanderClick,
        task,
      ]
    );

    const backgroundColor = isSelected
      ? "var(--gantt-table-selected-task-background-color)"
      : isEven
        ? "var(--gantt-table-even-background-color)"
        : undefined;

    return (
      <div
        ref={ref}
        className={`${styles.taskListTableRow} ${isCut ? styles.isCut : ""} ${moveOverPosition === "after" ? styles.isAfter : ""} ${moveOverPosition === "before" ? styles.isBefore : ""}`}
        onMouseDown={onRootMouseDown}
        style={{
          height: fullRowHeight,
          backgroundColor: backgroundColor,
          ...style,
        }}
        onContextMenu={onContextMenu}
      >
        {!isOverlay && moveHandleProps && (
          <div className={`${styles.dragIndicator}`} {...moveHandleProps}>
            <DragIndicatorIcon className={styles.dragIndicatorIcon} />
          </div>
        )}

        {columns.map(({id, component: Component, width }, index) => {
          return (
            <div
              className={styles.taskListCell}
              style={{
                minWidth: width,
                maxWidth: width,
              }}
              key={`${id}-${index}`}
            >
              <Component data={columnData} />
            </div>
          );
        })}

        {/*<div*/}
        {/*  data-testid={`table-row-drop-before-${task.name}`}*/}
        {/*  className={`${styles.dropBefore} ${*/}
        {/*    hoveringState.hoveringBefore ? styles.dropBeforeLighten : ""*/}
        {/*  }`}*/}
        {/*  style={{*/}
        {/*    left: dropPreviewOffset,*/}
        {/*    backgroundColor: hoveringState.hoveringBefore*/}
        {/*      ? "var(--gantt-table-drag-task-background-color)"*/}
        {/*      : undefined,*/}
        {/*    color: hoveringState.hoveringBefore*/}
        {/*      ? "var(--gantt-table-drag-task-background-color)"*/}
        {/*      : undefined,*/}
        {/*  }}*/}
        {/*  onDragEnter={event => {*/}
        {/*    event.preventDefault();*/}
        {/*    setHoveringState({*/}
        {/*      hoveringBefore: canDropBefore(),*/}
        {/*      hoveringInside: false,*/}
        {/*      hoveringAfter: false,*/}
        {/*    });*/}
        {/*  }}*/}
        {/*  onDragLeave={() => {*/}
        {/*    setHoveringState(prevState => {*/}
        {/*      return { ...prevState, hoveringBefore: false };*/}
        {/*    });*/}
        {/*  }}*/}
        {/*  onDragOver={event => {*/}
        {/*    event.preventDefault();*/}
        {/*    event.dataTransfer.dropEffect = canDropBefore() ? "move" : "none";*/}
        {/*  }}*/}
        {/*  onDrop={dropBefore}*/}
        {/*/>*/}
        {/*<div*/}
        {/*  data-testid={`table-row-drop-after-${task.name}`}*/}
        {/*  className={`${styles.dropAfter} ${*/}
        {/*    hoveringState.hoveringAfter ? styles.dropBeforeLighten : ""*/}
        {/*  }`}*/}
        {/*  style={{*/}
        {/*    left: dropPreviewOffset,*/}
        {/*    backgroundColor: hoveringState.hoveringAfter*/}
        {/*      ? "var(--gantt-table-drag-task-background-color)"*/}
        {/*      : undefined,*/}
        {/*    color: hoveringState.hoveringAfter*/}
        {/*      ? "var(--gantt-table-drag-task-background-color)"*/}
        {/*      : undefined,*/}
        {/*  }}*/}
        {/*  onDragEnter={() =>*/}
        {/*    setHoveringState({*/}
        {/*      hoveringBefore: false,*/}
        {/*      hoveringInside: false,*/}
        {/*      hoveringAfter: canDropAfter(),*/}
        {/*    })*/}
        {/*  }*/}
        {/*  onDragLeave={() =>*/}
        {/*    setHoveringState(prevState => {*/}
        {/*      return { ...prevState, hoveringAfter: false };*/}
        {/*    })*/}
        {/*  }*/}
        {/*  onDragOver={event => {*/}
        {/*    event.preventDefault();*/}
        {/*    event.dataTransfer.dropEffect = canDropAfter() ? "move" : "none";*/}
        {/*  }}*/}
        {/*  onDrop={dropAfter}*/}
        {/*/>*/}
      </div>
    );
  }
);

export const TaskListTableRow = memo(TaskListTableRowInner);
