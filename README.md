# kvandake-gantt-task-react

## Interactive Gantt Chart for React with TypeScript.

## [Live Demo In Storybook](https://661071b076b50cb537c16c19-yrsukdfefs.chromatic.com/)

## Install

```
npm install kvandake-gantt-task-react
```

## How to use it

```ts
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";

let tasks: Task[] = [
    {
      start: new Date(2020, 1, 1),
      end: new Date(2020, 1, 2),
      name: 'Idea',
      id: 'Task 0',
      type:'task',
      progress: 45,
      isDisabled: true,
      styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
    },
    ...
];
<Gantt tasks={tasks} />
```

You may handle actions

```ts
<Gantt
  tasks={tasks}
  viewMode={view}
  onDateChange={onTaskChange}
  onTaskDelete={onTaskDelete}
  onProgressChange={onProgressChange}
  onDoubleClick={onDblClick}
  onClick={onClick}
/>
```

## Theming and CSS variables

`Gantt` принимает проп `theme` со структурами `colors`, `typography`, `shape`, `distances`. Значения автоматически превращаются в CSS-переменные, доступные во всех компонентах.

```tsx
import { Gantt, buildGanttTheme } from "gantt-task-react";

const theme = buildGanttTheme({
  colors: {
    backgroundColor: "#F5F7FB",
    barProgressColor: "#2F80ED",
    freezeBackgroundColor: "rgba(47, 128, 237, 0.1)",
    freezeStripeColor: "rgba(47, 128, 237, 0.25)",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

<Gantt tasks={tasks} theme={theme} />;
```

Доступные CSS-переменные:

- `--gantt-*` цвета для баров/проектов/tooltip/context-menu
- `--gantt-font-family`, `--gantt-font-size`, `--gantt-shape-border-radius`
- `--gantt-freeze-background-color`, `--gantt-freeze-stripe-color` — стили слоя заморозки

Для кастомных компонентов можно получить тему и набор переменных через хуки:

```ts
import { useGanttTheme, useGanttThemeTokens } from "gantt-task-react";

const CustomControl = () => {
  const theme = useGanttTheme();
  const cssVars = useGanttThemeTokens();
  // ...
};
```

## Custom components & feature hooks

- `components`: переопределение корневых частей UI

```tsx
<Gantt
  tasks={tasks}
  components={{
    TaskList: MyTaskList,
    TaskBoard: MyTaskBoard,
    Tooltip: MyTooltip,
  }}
/>
```

- `features`: быстрое включение/выключение модулей (`relations`, `baseline`, `groups`, `freeze`, `tooltip`).
- Хуки для расширений: `useRelations`, `useBaseline`, `useGroups`, `useZoom`, `useFreezeDates`.
- `frozenDates`: массив `{ start, end }`, зона подсвечивается `--gantt-freeze-background-color`.

### Freeze dates

```tsx
<Gantt
  tasks={tasks}
  frozenDates={[
    { start: new Date(2025, 0, 1), end: new Date(2025, 0, 10) },
    { start: new Date(2025, 1, 20), end: new Date(2025, 1, 25) },
  ]}
  calculateFrozenDates
/>
```

- При `calculateFrozenDates=true` периоды мерджатся, и библиотека автоматически исключает их из рабочих дней.
- Внутри Gantt можно вызвать `const { frozenDates, enabled } = useFreezeDates()` и отрисовать кастомное состояние или подсказку.

```ts
import { useRelations } from "gantt-task-react";

const RelationInspector = () => {
  const { dependencyMap, enabled } = useRelations();
  if (!enabled) return null;
  // render custom relations widget
};
```

## How to run example

```shell
yarn storebook
```

## Gantt Configuration

### GanttProps

| Parameter Name                  | Type          | Description                                        |
| :------------------------------ | :------------ | :------------------------------------------------- |
| tasks\*                         | [Task](#Task) | Tasks array.                                       |
| [EventOption](#EventOption)     | interface     | Specifies gantt events.                            |
| [DisplayOption](#DisplayOption) | interface     | Specifies view type and display timeline language. |
| [StylingOption](#StylingOption) | interface     | Specifies chart and global tasks styles            |

### EventOption

| Parameter Name     | Type                                                                          | Description                                                                             |
| :----------------- | :---------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| onSelect           | (task: Task, isSelected: boolean) => void                                     | Specifies the function to be executed on the taskbar select or unselect event.          |
| onDoubleClick      | (task: Task) => void                                                          | Specifies the function to be executed on the taskbar onDoubleClick event.               |
| onClick            | (task: Task) => void                                                          | Specifies the function to be executed on the taskbar onClick event.                     |
| onDelete\*         | (task: Task) => void/boolean/Promise<void>/Promise<boolean>                   | Specifies the function to be executed on the taskbar on Delete button press event.      |
| onDateChange\*     | (task: Task, children: Task[]) => void/boolean/Promise<void>/Promise<boolean> | Specifies the function to be executed when drag taskbar event on timeline has finished. |
| onProgressChange\* | (task: Task, children: Task[]) => void/boolean/Promise<void>/Promise<boolean> | Specifies the function to be executed when drag taskbar progress event has finished.    |
| onExpanderClick\*  | onExpanderClick: (task: Task) => void;                                        | Specifies the function to be executed on the table expander click                       |
| onWheel\*          | onWheel: (wheelEvent: WheelEvent) => void;                                    | Specifies the function to be executed when the mouse wheel is used                           |
| timeStep           | number                                                                        | A time step value for onDateChange. Specify in milliseconds.                            |

\* Chart undoes operation if method return false or error. Parameter children returns one level deep records.

### DisplayOption

| Parameter Name      | Type    | Description                                                                                                 |
| :------------------ | :------ | :---------------------------------------------------------------------------------------------------------- |
| viewMode            | enum    | Specifies the time scale. Hour, Quarter Day, Half Day, Day, Week(ISO-8601, 1st day is Monday), Month, Year. |
| viewDate            | date    | Specifies display date and time for display.                                                                |
| preStepsCount       | number  | Specifies empty space before the fist task                                                                  |
| locale              | string  | Specifies the month name language. Able formats: ISO 639-2, Java Locale.                                    |
| monthCalendarFormat | string  | Specifies the month display on calendar                                                                     |
| monthTaskListFormat | string  | Specifies the month display on list.                                                                        |
| rtl                 | boolean | Sets rtl mode.                                                                                              |

### StylingOption

| Parameter Name             | Type   | Description                                                                                    |
| :------------------------- | :----- | :--------------------------------------------------------------------------------------------- |
| headerHeight               | number | Specifies the header height.                                                                   |
| ganttHeight                | number | Specifies the gantt chart height without header. Default is 0. It`s mean no height limitation. |
| columnWidth                | number | Specifies the time period width.                                                               |
| listCellWidth              | string | Specifies the task list cell width. Empty string is mean "no display".                         |
| rowHeight                  | number | Specifies the task row height.                                                                 |
| barCornerRadius            | number | Specifies the taskbar corner rounding.                                                         |
| barFill                    | number | Specifies the taskbar occupation. Sets in percent from 0 to 100.                               |
| handleWidth                | number | Specifies width the taskbar drag event control for start and end dates.                        |
| fontFamily                 | string | Specifies the application font.                                                                |
| fontSize                   | string | Specifies the application font size.                                                           |
| barProgressColor           | string | Specifies the taskbar progress fill color globally.                                            |
| barProgressSelectedColor   | string | Specifies the taskbar progress fill color globally on select.                                  |
| barBackgroundColor         | string | Specifies the taskbar background fill color globally.                                          |
| barBackgroundSelectedColor | string | Specifies the taskbar background fill color globally on select.                                |
| arrowColor                 | string | Specifies the relationship arrow fill color.                                                   |
| arrowIndent                | number | Specifies the relationship arrow right indent. Sets in px                                      |
| todayColor                 | string | Specifies the current period column fill color.                                                |
| TooltipContent             |        | Specifies the Tooltip view for selected taskbar.                                               |
| TaskListHeader             |        | Specifies the task list Header view                                                            |
| TaskListTable              |        | Specifies the task list Table view                                                             |

- TooltipContent: [`React.FC<{ task: Task; fontSize: string; fontFamily: string; }>;`](https://github.com/MaTeMaTuK/gantt-task-react/blob/main/src/components/other/tooltip.tsx#L56)
- TaskListHeader: `React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string;}>;`
- TaskListTable: `React.FC<{ rowHeight: number; rowWidth: string; fontFamily: string; fontSize: string; locale: string; tasks: Task[]; selectedTaskId: string; setSelectedTask: (taskId: string) => void; }>;`

### Task

| Parameter Name | Type     | Description                                                                                           |
| :------------- | :------- | :---------------------------------------------------------------------------------------------------- |
| id\*           | string   | Task id.                                                                                              |
| name\*         | string   | Task display name.                                                                                    |
| type\*         | string   | Task display type: **task**, **milestone**, **project**                                               |
| start\*        | Date     | Task start date.                                                                                      |
| end\*          | Date     | Task end date.                                                                                        |
| progress\*     | number   | Task progress. Sets in percent from 0 to 100.                                                         |
| assignees\*    | string[] | List of people assigned to the task                                                                   |
| dependencies   | string[] | Specifies the parent dependencies ids.                                                                |
| styles         | object   | Specifies the taskbar styling settings locally. Object is passed with the following attributes:       |
|                |          | - **backgroundColor**: String. Specifies the taskbar background fill color locally.                   |
|                |          | - **backgroundSelectedColor**: String. Specifies the taskbar background fill color locally on select. |
|                |          | - **progressColor**: String. Specifies the taskbar progress fill color locally.                       |
|                |          | - **progressSelectedColor**: String. Specifies the taskbar progress fill color globally on select.    |
| isDisabled     | bool     | Disables all action for current task.                                                                 |
| fontSize       | string   | Specifies the taskbar font size locally.                                                              |
| project        | string   | Task project name                                                                                     |
| hideChildren   | bool     | Hide children items. Parameter works with project type only                                           |

\*Required

## License

[MIT](./LICENSE)
