import React, { memo, MouseEvent, ReactNode, useMemo } from "react";

import {
  ChildByLevelMap,
  CriticalPaths,
  DependencyMap,
  DependentMap,
  Distances,
  GanttRelationEvent,
  GanttTaskBarActions,
  GlobalRowIndexToTaskMap,
  RelationKind,
  RelationMoveTarget,
  RenderCustomLabel,
  RenderTask,
  Task,
  TaskBarMoveAction,
  TaskCoordinates,
  ViewMode,
} from "../../types";
import { Arrow } from "../other/arrow";
import { RelationLine } from "../other/relation-line";
import { TaskItem } from "../task-item/task-item";
import styles from "./task-gantt-content.module.css";
import { checkHasChildren } from "../../helpers/check-has-children";
import type { OptimizedListParams } from "../../helpers/use-optimized-list";
import { BarComparison } from "../task-item/bar-comparison";

const DELTA_RELATION_WIDTH = 100;

export interface TaskGanttContentProps extends GanttTaskBarActions {
  authorizedRelations: RelationKind[];
  additionalLeftSpace: number;
  additionalRightSpace: number;
  checkIsHoliday: (date: Date) => boolean;
  childTasksMap: ChildByLevelMap;
  comparisonLevels: number;
  criticalPaths: CriticalPaths | null;
  dependencyMap: DependencyMap;
  dependentMap: DependentMap;
  distances: Distances;
  endColumnIndex: number;
  fullRowHeight: number;
  ganttRelationEvent: GanttRelationEvent | null;
  getDate: (index: number) => Date;
  getTaskCoordinates: (task: Task) => TaskCoordinates;
  onTaskBarRelationStart: (target: RelationMoveTarget, task: Task) => void;
  onDeleteTask: (task: RenderTask) => void;
  onTaskBarDragStart: (
    action: TaskBarMoveAction,
    task: Task,
    clientX: number,
    taskRootNode: Element,
  ) => void;
  mapGlobalRowIndexToTask: GlobalRowIndexToTaskMap;
  onArrowDoubleClick: (taskFrom: Task, taskTo: Task) => void;
  onClick?: (task: Task, event: React.MouseEvent<SVGElement>) => void;
  onDoubleClick?: (task: Task) => void;
  renderedRowIndexes: OptimizedListParams | null;
  rtl: boolean;
  waitCommitTasks?: boolean;
  selectTaskOnMouseDown: (taskId: string, event: MouseEvent) => void;
  selectedIdsMirror: Readonly<Record<string, true>>;
  onTooltipTask: (task: Task | null, element: Element | null) => void;
  startColumnIndex: number;
  taskYOffset: number;
  visibleTasksMirror: Readonly<Record<string, true>>;
  taskHeight: number;
  taskHalfHeight: number;
  renderCustomLabel?: RenderCustomLabel;
  isProgressChangeable?: (task: Task) => boolean;
  isDateChangeable?: (task: Task) => boolean;
  isRelationChangeable?: (task: Task) => boolean;
  taskBarMovingAction: (task: RenderTask) => TaskBarMoveAction | null;
  viewMode: ViewMode;
}

const TaskGanttContentInner: React.FC<TaskGanttContentProps> = (props) => {
  const {
    authorizedRelations,
    additionalLeftSpace,
    checkIsHoliday,
    childTasksMap,
    comparisonLevels,
    criticalPaths,
    dependencyMap,
    dependentMap,
    distances,
    endColumnIndex,
    fullRowHeight,
    ganttRelationEvent,
    getDate,
    getTaskCoordinates,
    onTaskBarRelationStart,
    onDeleteTask,
    onTaskBarDragStart,
    mapGlobalRowIndexToTask,
    onArrowDoubleClick,
    onDoubleClick,
    onClick,
    renderedRowIndexes,
    rtl,
    selectTaskOnMouseDown,
    selectedIdsMirror,
    onTooltipTask,
    startColumnIndex,
    taskYOffset,
    taskHeight,
    taskHalfHeight,
    visibleTasksMirror,
    isProgressChangeable = task => !task.isDisabled,
    isDateChangeable = task => !task.isDisabled,
    isRelationChangeable = task => !task.isDisabled,
    allowMoveTaskBar,
    renderCustomLabel,
    taskBarMovingAction,
    waitCommitTasks,
    viewMode,
  } = props;

  const renderedHolidays = useMemo(() => {
    const { columnWidth } = distances;

    const res: ReactNode[] = [];

    for (let i = startColumnIndex; i <= endColumnIndex; ++i) {
      const date = getDate(i);

      if (checkIsHoliday(date)) {
        res.push(
          <rect
            height="100%"
            width={columnWidth}
            x={additionalLeftSpace + i * columnWidth}
            y={0}
            fill={"var(--gantt-calendar-holiday-color)"}
            key={i}
            pointerEvents={'none'}
          />,
        );
      }
    }

    return res;
  }, [
    additionalLeftSpace,
    checkIsHoliday,
    distances,
    endColumnIndex,
    getDate,
    startColumnIndex,
  ]);

  const [renderedTasks, renderedArrows, renderedSelectedTasks] = useMemo(() => {
    if (!renderedRowIndexes) {
      return [null, null, null];
    }

    const [start, end] = renderedRowIndexes;

    const tasksRes: ReactNode[] = [];
    const arrowsRes: ReactNode[] = [];
    const selectedTasksRes: ReactNode[] = [];

    // task id -> true
    const addedSelectedTasks: Record<string, true> = {};

    // avoid duplicates
    // comparison level -> task from id -> task to id -> true
    const addedDependencies: Record<
      string,
      Record<string, Record<string, true>>
    > = {};

    for (let index = start; index <= end; ++index) {
      const task = mapGlobalRowIndexToTask.get(index);

      if (!task) {
        continue;
      }

      const { comparisonLevel = 1, id: taskId } = task;

      if (selectedIdsMirror[taskId] && !addedSelectedTasks[taskId]) {
        addedSelectedTasks[taskId] = true;

        selectedTasksRes.push(
          <rect
            x={0}
            y={Math.floor(index / comparisonLevels) * fullRowHeight}
            width="100%"
            height={fullRowHeight}
            fill={"var(--gantt-table-selected-task-background-color)"}
            key={taskId}
            pointerEvents={'none'}
          />,
        );
      }

      if (comparisonLevel > comparisonLevels) {
        continue;
      }

      if (task.type === "empty") {
        continue;
      }

      const key = `${comparisonLevel}_${task.id}`;

      const criticalPathOnLevel = criticalPaths
        ? criticalPaths.get(comparisonLevel)
        : undefined;

      const isCritical = criticalPathOnLevel
        ? criticalPathOnLevel.tasks.has(task.id)
        : false;

      const {
        containerX,
        containerWidth,
        innerX1,
        innerX2,
        width,
        levelY,
        progressWidth,
        x1: taskX1,
        x2: taskX2,
        comparisonDates,
      } = getTaskCoordinates(task);

      tasksRes.push(
        <svg
          id={task.id}
          className={`${styles.TaskItemWrapper} TaskItemWrapper`}
          x={Math.max(containerX + (additionalLeftSpace || 0), 0)}
          y={levelY}
          width={Math.max(containerWidth, 0)}
          height={fullRowHeight}
          key={key}
        >
          <TaskItem
            movingAction={taskBarMovingAction(task)}
            allowMoveTaskBar={allowMoveTaskBar}
            hasChildren={checkHasChildren(task, childTasksMap)}
            progressWidth={progressWidth}
            progressX={rtl ? innerX2 : innerX1}
            onSelectTaskOnMouseDown={selectTaskOnMouseDown}
            task={task}
            taskYOffset={taskYOffset}
            width={width}
            x1={innerX1}
            x2={innerX2}
            distances={distances}
            taskHeight={taskHeight}
            taskHalfHeight={taskHalfHeight}
            isProgressChangeable={t =>
              isProgressChangeable(t) && !waitCommitTasks
            }
            isDateChangeable={t => isDateChangeable(t) && !waitCommitTasks}
            isRelationChangeable={t =>
              isRelationChangeable(t) && !waitCommitTasks
            }
            authorizedRelations={authorizedRelations}
            ganttRelationEvent={ganttRelationEvent}
            canDelete={!task.isDisabled && !waitCommitTasks}
            onDoubleClick={onDoubleClick}
            onClick={onClick}
            onEventStart={onTaskBarDragStart}
            onTooltipTask={onTooltipTask}
            onRelationStart={onTaskBarRelationStart}
            isSelected={Boolean(selectedIdsMirror[taskId])}
            isCritical={isCritical}
            rtl={rtl}
            onDeleteTask={onDeleteTask}
            renderCustomLabel={renderCustomLabel}
            viewMode={viewMode}
          />
        </svg>,
      );

      if (task.comparisonDates && comparisonDates) {
        tasksRes.push(
          <svg
            id={task.id + "_comparison"}
            key={key + "_comparison"}
            className={"TaskItemWrapperComparison"}
            x={Math.max(comparisonDates.x + (additionalLeftSpace || 0), 0)}
            y={comparisonDates.y}
            width={comparisonDates.width}
            height={comparisonDates.height * 2}
          >
            <BarComparison
              inProgress={!task.comparisonDates.end}
              isPlan={
                (task.comparisonDates.start.getTime() >= task.start.getTime() &&
                  (!!task.comparisonDates.end && task.comparisonDates.end.getTime() <= task.end.getTime())) ||
                (task.comparisonDates.start.getTime() <= task.start.getTime() &&
                  (!!task.comparisonDates.end && task.comparisonDates.end.getTime() <= task.start.getTime()))
              }
              isWarning={
                !!task.comparisonDates.end && task.comparisonDates.end.getTime() >= task.end.getTime()
              }
              isCritical={
                task.comparisonDates.start.getTime() > task.start.getTime()
              }
              barCornerRadius={distances.barCornerRadius}
              height={comparisonDates.height}
              width={comparisonDates.width}
              borderHeight={distances.barComparisonTaskBorderHeight}
              yOffset={distances.barComparisonTaskYOffset}
            />
          </svg>,
        );
      }

      const addedDependenciesAtLevel = addedDependencies[comparisonLevel] || {};
      if (!addedDependencies[comparisonLevel]) {
        addedDependencies[comparisonLevel] = addedDependenciesAtLevel;
      }

      const addedDependenciesAtTask = addedDependenciesAtLevel[taskId] || {};
      if (!addedDependenciesAtLevel[taskId]) {
        addedDependenciesAtLevel[taskId] = addedDependenciesAtTask;
      }

      const dependenciesAtLevel = dependencyMap.get(comparisonLevel);

      if (!dependenciesAtLevel) {
        continue;
      }

      const dependenciesByTask = dependenciesAtLevel.get(taskId);

      if (dependenciesByTask) {
        const criticalPathForTask = criticalPathOnLevel
          ? criticalPathOnLevel.dependencies.get(task.id)
          : undefined;

        dependenciesByTask
          .filter(({ source }) => visibleTasksMirror[source.id])
          .forEach(
            ({
               containerHeight,
               containerY,
               innerFromY,
               innerToY,
               ownTarget,
               source,
               sourceTarget,
             }) => {
              if (addedDependenciesAtTask[source.id]) {
                return;
              }

              addedDependenciesAtTask[source.id] = true;

              const isCritical = criticalPathForTask
                ? criticalPathForTask.has(source.id)
                : false;

              const { x1: fromX1, x2: fromX2 } = getTaskCoordinates(source);

              const containerX = Math.min(fromX1, taskX1) - DELTA_RELATION_WIDTH;
              const containerWidth = Math.max(fromX2, taskX2) - containerX + DELTA_RELATION_WIDTH;

              arrowsRes.push(
                <svg
                  x={Math.max(containerX + (additionalLeftSpace || 0), 0)}
                  y={containerY}
                  width={containerWidth}
                  height={containerHeight}
                  key={`Arrow from ${source.id} to ${taskId} on ${comparisonLevel}`}
                >
                  <Arrow
                    distances={distances}
                    taskFrom={source}
                    targetFrom={sourceTarget}
                    fromX1={fromX1 - containerX}
                    fromX2={fromX2 - containerX}
                    fromY={innerFromY}
                    taskTo={task}
                    targetTo={ownTarget}
                    toX1={taskX1 - containerX}
                    toX2={taskX2 - containerX}
                    toY={innerToY}
                    fullRowHeight={fullRowHeight}
                    taskHeight={taskHeight}
                    isCritical={isCritical}
                    rtl={rtl}
                    onArrowDoubleClick={onArrowDoubleClick}
                  />
                </svg>,
              );
            },
          );
      }

      const dependentsAtLevel = dependentMap.get(comparisonLevel);

      if (!dependentsAtLevel) {
        continue;
      }

      const dependentsByTask = dependentsAtLevel.get(taskId);

      if (dependentsByTask) {
        dependentsByTask
          .filter(({ dependent }) => visibleTasksMirror[dependent.id])
          .forEach(
            ({
               containerHeight,
               containerY,
               innerFromY,
               innerToY,
               ownTarget,
               dependent,
               dependentTarget,
             }) => {
              const addedDependenciesAtDependent =
                addedDependenciesAtLevel[dependent.id] || {};
              if (!addedDependenciesAtLevel[dependent.id]) {
                addedDependenciesAtLevel[dependent.id] =
                  addedDependenciesAtDependent;
              }

              if (addedDependenciesAtDependent[taskId]) {
                return;
              }

              addedDependenciesAtDependent[taskId] = true;

              const criticalPathForTask = criticalPathOnLevel
                ? criticalPathOnLevel.dependencies.get(dependent.id)
                : undefined;

              const isCritical = criticalPathForTask
                ? criticalPathForTask.has(task.id)
                : false;

              const { x1: toX1, x2: toX2 } = getTaskCoordinates(dependent);

              const containerX =  Math.min(toX1, taskX1) - DELTA_RELATION_WIDTH;
              const containerWidth = Math.max(toX2, taskX2) - containerX + DELTA_RELATION_WIDTH;

              arrowsRes.push(
                <svg
                  x={Math.max(containerX + (additionalLeftSpace || 0), 0)}
                  y={containerY}
                  width={containerWidth}
                  height={containerHeight}
                  key={`Arrow from ${taskId} to ${dependent.id} on ${comparisonLevel}`}
                >
                  <Arrow
                    distances={distances}
                    taskFrom={task}
                    targetFrom={ownTarget}
                    fromX1={taskX1 - containerX}
                    fromX2={taskX2 - containerX}
                    fromY={innerFromY}
                    taskTo={dependent}
                    targetTo={dependentTarget}
                    toX1={toX1 - containerX}
                    toX2={toX2 - containerX}
                    toY={innerToY}
                    fullRowHeight={fullRowHeight}
                    taskHeight={taskHeight}
                    isCritical={isCritical}
                    rtl={rtl}
                    onArrowDoubleClick={onArrowDoubleClick}
                  />
                </svg>,
              );
            },
          );
      }
    }

    return [tasksRes, arrowsRes, selectedTasksRes];
  }, [
    viewMode,
    renderedRowIndexes,
    mapGlobalRowIndexToTask,
    selectedIdsMirror,
    comparisonLevels,
    criticalPaths,
    getTaskCoordinates,
    additionalLeftSpace,
    fullRowHeight,
    taskBarMovingAction,
    allowMoveTaskBar,
    childTasksMap,
    rtl,
    selectTaskOnMouseDown,
    taskYOffset,
    distances,
    taskHeight,
    taskHalfHeight,
    authorizedRelations,
    ganttRelationEvent,
    waitCommitTasks,
    onDoubleClick,
    onClick,
    onTaskBarDragStart,
    onTooltipTask,
    onTaskBarRelationStart,
    onDeleteTask,
    renderCustomLabel,
    dependencyMap,
    dependentMap,
    isProgressChangeable,
    isDateChangeable,
    isRelationChangeable,
    visibleTasksMirror,
    onArrowDoubleClick,
  ]);

  return (
    <g className="content">
      {renderedSelectedTasks}

      <g>{renderedHolidays}</g>


      <g
        className="arrows"
        fill={"var(--gantt-arrow-color)"}
        stroke={"var(--gantt-arrow-color)"}
      >
        {renderedArrows}
      </g>

      <g
        className="bar"
        fontFamily={"var(--gantt-font-family)"}
        fontSize={"var(--gantt-font-size)"}
      >
        {renderedTasks}
      </g>

      {ganttRelationEvent && (
        <RelationLine
          x1={ganttRelationEvent.startX}
          x2={ganttRelationEvent.endX}
          y1={ganttRelationEvent.startY}
          y2={ganttRelationEvent.endY}
        />
      )}
    </g>
  );
};

export const TaskGanttContent = memo(TaskGanttContentInner);
