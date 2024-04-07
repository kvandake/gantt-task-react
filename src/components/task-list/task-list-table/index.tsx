import type { ReactNode } from "react";
import React, { memo, useMemo } from "react";

import { checkHasChildren } from "../../../helpers/check-has-children";
import { Task, TaskListTableProps } from "../../../types/public-types";
import { TaskListTableRow } from "../task-list-table-row";

import styles from "./task-list-table.module.css";

const TaskListTableDefaultInner: React.FC<TaskListTableProps> = ({
  childTasksMap,
  columns,
  cutIdsMirror,
  dateSetup,
  dependencyMap,
  distances,
  fullRowHeight,
  getTaskCurrentState,
  handleAddTask,
  handleDeleteTasks,
  handleEditTask,
  handleOpenContextMenu,
  icons,
  isShowTaskNumbers,
  mapTaskToNestedIndex,
  onClick,
  onExpanderClick,
  renderedIndexes,
  scrollToTask,
  selectTaskOnMouseDown,
  selectedIdsMirror,
  tasks,
}) => {
  const renderedTasks = useMemo(
    /**
     * TO DO: maybe consider tasks on other levels?
     */
    () =>
      tasks.filter(task => !task.comparisonLevel || task.comparisonLevel === 1),
    [tasks]
  );

  const renderedListWithOffset = useMemo(() => {
    if (!renderedIndexes) {
      return null;
    }

    const [start, end] = renderedIndexes;

    const renderedList: ReactNode[] = [];

    for (let index = start; index <= end; ++index) {
      const task = renderedTasks[index];

      if (!task) {
        break;
      }

      const { id, comparisonLevel = 1 } = task;

      const indexesOnLevel = mapTaskToNestedIndex.get(comparisonLevel);

      if (!indexesOnLevel) {
        throw new Error(`Indexes are not found for level ${comparisonLevel}`);
      }

      const taskIndex = indexesOnLevel.get(id);

      if (!taskIndex) {
        throw new Error(`Index is not found for task ${id}`);
      }

      const [depth, indexStr] = taskIndex;

      renderedList.push(
        <TaskListTableRow
          columns={columns}
          dateSetup={dateSetup}
          dependencyMap={dependencyMap}
          depth={depth}
          distances={distances}
          fullRowHeight={fullRowHeight}
          getTaskCurrentState={getTaskCurrentState}
          handleAddTask={handleAddTask}
          handleDeleteTasks={handleDeleteTasks}
          handleEditTask={handleEditTask}
          handleOpenContextMenu={handleOpenContextMenu}
          hasChildren={checkHasChildren(task, childTasksMap)}
          icons={icons}
          indexStr={indexStr}
          isClosed={Boolean((task as Task)?.hideChildren)}
          isCut={cutIdsMirror[id]}
          isEven={index % 2 === 1}
          isSelected={selectedIdsMirror[id]}
          isShowTaskNumbers={isShowTaskNumbers}
          onClick={onClick}
          onExpanderClick={onExpanderClick}
          scrollToTask={scrollToTask}
          selectTaskOnMouseDown={selectTaskOnMouseDown}
          task={task}
          key={id}
        />
      );
    }

    return (
      <>
        <div
          style={{
            height: fullRowHeight * start,
          }}
        />

        {renderedList}
      </>
    );
  }, [
    renderedIndexes,
    fullRowHeight,
    renderedTasks,
    mapTaskToNestedIndex,
    columns,
    dateSetup,
    dependencyMap,
    distances,
    getTaskCurrentState,
    handleAddTask,
    handleDeleteTasks,
    handleEditTask,
    handleOpenContextMenu,
    childTasksMap,
    icons,
    cutIdsMirror,
    selectedIdsMirror,
    isShowTaskNumbers,
    onClick,
    onExpanderClick,
    scrollToTask,
    selectTaskOnMouseDown,
  ]);

  return (
    <div
      className={styles.taskListWrapper}
      style={{
        fontFamily: "var(--gantt-font-family)",
        fontSize: "var(--gantt-font-size)",
      }}
    >
      {renderedListWithOffset}
    </div>
  );
};

export const TaskListTable = memo(TaskListTableDefaultInner);
