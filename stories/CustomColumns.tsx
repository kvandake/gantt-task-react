import React, { useCallback, useRef, useState } from "react";

import {
  Column,
  ColumnProps,
  DateEndColumn,
  DateStartColumn,
  defaultRoundEndDate,
  defaultRoundStartDate,
  Gantt,
  GanttRefProps,
  OnCommitTasks,
  OnResizeColumn,
  RenderTask,
  Task,
  TaskCenterLabel,
  TaskOutlineLabel,
  TitleColumn,
  ViewMode,
} from "../src";
import { addDays, differenceInDays } from "date-fns";
import { initTasks, onAddTask, onEditTask } from "./helper";

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const ProgressColumn: React.FC<ColumnProps> = ({ data: { task } }) => {
  if (task.type === "project" || task.type === "task") {
    return <>{task.progress}%</>;
  }

  return null;
};

type AppProps = {
  ganttHeight?: number;
};

enum TaskListColumnEnum {
  NAME = "Name",
  FROM = "From",
  TO = "To",
  PROGRESS = "Progress",
  ASSIGNEE = "Assignee",
}

const VIEW_MODE_OPTIONS_ARRAY: Array<{ mode: ViewMode; index: number }> = [
  { mode: ViewMode.Hour, index: 0 },
  { mode: ViewMode.QuarterDay, index: 1 },
  { mode: ViewMode.HalfDay, index: 2 },
  { mode: ViewMode.Day, index: 3 },
  { mode: ViewMode.Week, index: 4 },
  { mode: ViewMode.Month, index: 5 },
  { mode: ViewMode.Year, index: 6 },
];

export const getColumns = (
  columnTypes: TaskListColumnEnum[],
  displayColumns: boolean,
) => {
  if (!displayColumns) {
    return new Map<TaskListColumnEnum, Column>();
  }
  const typeToColumn = new Map<TaskListColumnEnum, Column>();
  columnTypes.forEach(columnType => {
    if (columnType === TaskListColumnEnum.NAME) {
      typeToColumn.set(columnType, {
        component: TitleColumn,
        width: 210,
        title: "Name",
        id: TaskListColumnEnum.NAME,
      });
    } else if (columnType === TaskListColumnEnum.FROM) {
      typeToColumn.set(columnType, {
        component: DateStartColumn,
        width: 150,
        title: "Date of start",
        id: TaskListColumnEnum.FROM,
      });
    } else if (columnType === TaskListColumnEnum.TO) {
      typeToColumn.set(columnType, {
        component: DateEndColumn,
        width: 150,
        title: "Date of end",
        id: TaskListColumnEnum.TO,
      });
    } else if (columnType === TaskListColumnEnum.PROGRESS) {
      typeToColumn.set(columnType, {
        component: ProgressColumn,
        width: 40,
        title: "Progress",
        id: TaskListColumnEnum.PROGRESS,
      });
    }
  });

  return typeToColumn;
};

export const CustomColumns: React.FC<AppProps> = props => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const ganttRef = useRef<GanttRefProps>();
  const handleViewModeMinus = useCallback(() => {
    setViewMode(prev => {
      const nextIndex = Math.max((VIEW_MODE_OPTIONS_ARRAY.find(x => x.mode == prev)?.index || 0) - 1, 0);
      return VIEW_MODE_OPTIONS_ARRAY.find(x => x.index == nextIndex)?.mode || ViewMode.Hour;
    });
    ganttRef.current?.scrollToFirstSelectedTask();
  }, []);
  const handleViewModePlus = useCallback(() => {
    setViewMode(prev => {
      const maxValue = VIEW_MODE_OPTIONS_ARRAY.length - 1;
      const nextIndex = Math.min((VIEW_MODE_OPTIONS_ARRAY.find(x => x.mode == prev)?.index || maxValue) + 1, maxValue);
      return VIEW_MODE_OPTIONS_ARRAY.find(x => x.index == nextIndex)?.mode || ViewMode.Year;
    });
    ganttRef.current?.scrollToFirstSelectedTask();
  }, []);
  const [tasks, setTasks] = useState<readonly RenderTask[]>(() => {
    const stateTasks = initTasks();


    const ideaTask = stateTasks.find(task => task.id === "Idea");
    if (ideaTask && ideaTask.type === "task") {
      ideaTask.comparisonDates = {
        start: addDays(ideaTask.start, -1),
        end: addDays(ideaTask.end, 0),
        // end: null // addDays(ideaTask.end, 0),
      };
    }

    return stateTasks;
  });

  const onCommitTasks = useCallback<OnCommitTasks>(
    async (nextTasks, action): Promise<boolean | void> => {
      switch (action.type) {
        case "date_change":
          await wait(100);
          setTasks(nextTasks);
          console.log("waiting 2 seconds ... Simulate update from server");
          break;
        case "delete_relation":
          if (
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            window.confirm(
              `Do yo want to remove relation between ${action.payload.taskFrom.name} and ${action.payload.taskTo.name}?`,
            )
          ) {
            setTasks(nextTasks);
            break;
          }
          break;
        case "delete_task":
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          if (window.confirm("Are you sure?")) {
            setTasks(nextTasks);
            break;
          }
      }

      setTasks(nextTasks);
    },
    [],
  );

  const handleDblClick = useCallback((task: Task) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    alert("On Double Click event Id:" + task.id);
  }, []);

  const handleClick = useCallback((task: RenderTask) => {
    console.log("On Click event Id:" + task.id);
  }, []);

  const typeToColumn: Map<TaskListColumnEnum, Column> = getColumns(
    [
      TaskListColumnEnum.NAME,
      TaskListColumnEnum.FROM,
      TaskListColumnEnum.TO,
      TaskListColumnEnum.PROGRESS,
    ],
    true,
  );
  const [displayedColumns, setDisplayedColumns] = useState<Column[]>(
    Array.from(typeToColumn.values()),
  );

  const onResizeColumn: OnResizeColumn = (newColumns: readonly Column[]) => {
    setDisplayedColumns(() => {
      return [...newColumns];
    });
  };

  return (
    <>
      <button onClick={handleViewModePlus}>+</button>
      <button onClick={handleViewModeMinus}>-</button>
      <Gantt
        {...props}
        ref={ganttRef}
        viewMode={viewMode}
        columns={displayedColumns}
        taskBar={{
          onClick: handleClick,
          onDoubleClick: handleDblClick,
          renderCustomLabel: (
            task,
            x1,
            width,
            taskHeight,
            arrowIndent,
            taskYOffset,
            movingAction,
            viewMode,
            rtl,
          ) => (
            <>
              {movingAction !== "start" && movingAction !== "end" && (
                <TaskCenterLabel
                  hideWhenSmall
                  viewMode={viewMode}
                  x1={x1}
                  rtl={rtl}
                  taskHeight={taskHeight}
                  arrowIndent={arrowIndent}
                  taskYOffset={taskYOffset}
                  width={width}
                  label={
                    task.type === "empty"
                      ? null
                      : `${differenceInDays(task.end, task.start)} day(s)`
                  }
                />
              )}

              <TaskOutlineLabel
                viewMode={viewMode}
                x1={x1}
                rtl={rtl}
                taskHeight={taskHeight}
                arrowIndent={arrowIndent}
                taskYOffset={taskYOffset}
                width={width}
                label={task.name}
              />
            </>
          ),
        }}
        taskList={{
          onResizeColumn: onResizeColumn,
          tableBottom: {
            height: 90,
            renderContent: () => (
              <div style={{ backgroundColor: "red", height: "100%", width: "100%" }}>Table bottom content</div>
            ),
          },
        }}
        theme={{
          distances: {
            ganttHeight: 600,
            // ganttHeight: (height || 0) - 60,
            minimumRowDisplayed: 0,
          },
        }}
        onAddTaskAction={onAddTask}
        onCommitTasks={onCommitTasks}
        onEditTaskAction={onEditTask}
        tasks={tasks}
        isAdjustToWorkingDates={false}
        roundStartDate={(date) => defaultRoundStartDate(date, ViewMode.Day)}
        roundEndDate={(date) => defaultRoundEndDate(date, ViewMode.Day)}
      />
    </>
  );
};
