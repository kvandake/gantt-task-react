import type { ReactNode } from "react";
import React, { memo, useMemo, useRef, useState } from "react";

import { checkHasChildren } from "../../../helpers/check-has-children";
import {
  Task,
  TaskListTableProps,
  TaskOrEmpty,
} from "../../../types/public-types";
import {
  Announcements,
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import styles from "../task-list-table/task-list-table.module.css";
import { sortableTreeKeyboardCoordinates } from "./keyboardCoordinates";
import { getProjection } from "./utilities";
import { SensorContext } from "./types";
import { createPortal } from "react-dom";
import { CSS } from "@dnd-kit/utilities";
import { TaskListSortableTableRow } from "../task-list-sortable-table-row";

const indentationWidth = 50;

const TaskListSortableTableDefaultInner: React.FC<TaskListTableProps> = ({
  allowMoveTask,
  canMoveTasks,
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
  handleMoveTaskBefore,
  handleMoveTaskAfter,
  handleMoveTasksInside,
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    parent: UniqueIdentifier | null;
    overId: UniqueIdentifier;
  } | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const renderedTasks = useMemo(
    /**
     * TO DO: maybe consider tasks on other levels?
     */
    () =>
      tasks.filter(task => !task.comparisonLevel || task.comparisonLevel === 1),
    [tasks]
  );

  const sensorContext: SensorContext = useRef({
    items: renderedTasks,
    offset: offsetLeft,
  });

  const getTaskDepth = (taskId: string | UniqueIdentifier): number => {
    const activeTask = renderedTasks.find(task => task.id === taskId);
    const activeTaskComparisonLevel = activeTask.comparisonLevel || 1;
    const [activeTaskDepth] = mapTaskToNestedIndex
      .get(activeTaskComparisonLevel)
      .get(activeId.toString());

    return activeTaskDepth || 1;
  };

  const getProjected = () => {
    if (!activeId || !overId) {
      return null;
    }

    return getProjection(
      renderedTasks,
      activeId,
      overId,
      offsetLeft,
      indentationWidth,
      getTaskDepth
    );
  };

  const projected = getProjected();

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  function getMovementAnnouncement(
    eventName: string,
    activeId: UniqueIdentifier,
    overId?: UniqueIdentifier
  ) {
    if (overId && projected) {
      if (eventName !== "onDragEnd") {
        if (
          currentPosition &&
          projected.parent === currentPosition.parent &&
          overId === currentPosition.overId
        ) {
          return null;
        } else {
          setCurrentPosition({
            parent: projected.parent,
            overId,
          });
        }
      }

      const clonedItems = [...renderedTasks];
      const overIndex = clonedItems.findIndex(({ id }) => id === overId);
      const activeIndex = clonedItems.findIndex(({ id }) => id === activeId);
      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);

      const previousItem = sortedItems[overIndex - 1];

      let announcement;
      const movedVerb = eventName === "onDragEnd" ? "dropped" : "moved";
      const nestedVerb = eventName === "onDragEnd" ? "dropped" : "nested";

      if (!previousItem) {
        const nextItem = sortedItems[overIndex + 1];
        announcement = `${activeId} was ${movedVerb} before ${nextItem.id}.`;
      } else {
        const previousDepth = getTaskDepth(previousItem.id);
        if (projected.depth > previousDepth) {
          announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
        } else {
          let previousSibling: TaskOrEmpty | undefined = previousItem;
          const previousSiblingDepth = getTaskDepth(previousSibling.id);
          while (previousSibling && projected.depth < previousSiblingDepth) {
            const parentId: UniqueIdentifier | null = previousSibling.parent;
            previousSibling = sortedItems.find(({ id }) => id === parentId);
          }

          if (previousSibling) {
            announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
          }
        }
      }

      return announcement;
    }

    return null;
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`;
    },
    onDragMove({ active, over }) {
      return getMovementAnnouncement("onDragMove", active.id, over?.id);
    },
    onDragOver({ active, over }) {
      return getMovementAnnouncement("onDragOver", active.id, over?.id);
    },
    onDragEnd({ active, over }) {
      return getMovementAnnouncement("onDragEnd", active.id, over?.id);
    },
    onDragCancel({ active }) {
      return `Moving was cancelled. ${active.id} was dropped in its original position.`;
    },
  };

  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, true, 50, getTaskDepth)
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
    setActiveId(activeId);
    setOverId(activeId);

    const activeItem = renderedTasks.find(({ id }) => id === activeId);

    if (activeItem) {
      setCurrentPosition({
        parent: activeItem.parent,
        overId: activeId,
      });
    }

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();

    if (projected && over) {
      const { depth, parent } = projected || {};
      const clonedItems = [...renderedTasks];
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      // clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };
      // const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      // const newItems = buildTree(sortedItems);

      // setItems(newItems);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setCurrentPosition(null);

    document.body.style.setProperty("cursor", "");
  }

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
        <TaskListSortableTableRow
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
    canMoveTasks,
    allowMoveTask,
    columns,
    dateSetup,
    dependencyMap,
    distances,
    getTaskCurrentState,
    handleAddTask,
    handleDeleteTasks,
    handleEditTask,
    handleMoveTaskBefore,
    handleMoveTaskAfter,
    handleMoveTasksInside,
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
    tasks,
  ]);

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={renderedTasks}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={styles.taskListWrapper}
          style={{
            fontFamily: "var(--gantt-font-family)",
            fontSize: "var(--gantt-font-size)",
          }}
        >
          {renderedListWithOffset}
        </div>
      </SortableContext>
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation} modifiers={undefined}>
          {activeId ? (
            <div style={{ height: 40, backgroundColor: "blue" }}>Test Drag</div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

const dropAnimation: DropAnimation = {
  keyframes({ transform }) {
    return [
      { transform: CSS.Transform.toString(transform.initial) },
      {
        transform: CSS.Transform.toString({
          scaleX: 0.98,
          scaleY: 0.98,
          x: transform.final.x - 10,
          y: transform.final.y - 10,
        }),
      },
    ];
  },
  sideEffects: defaultDropAnimationSideEffects({
    className: {
      active: "active",
    },
  }),
};

export const TaskListSortableTable = memo(TaskListSortableTableDefaultInner);
