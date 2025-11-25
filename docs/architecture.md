# Архитектурный аудит gantt-task-react

## 1. Текущие слои и зависимости

- `src/components/gantt`: монолитный контейнер (`gantt.tsx`) управляет состоянием, рендерит список задач (`TaskList`) и канвас (`TaskGantt`), содержит десятки хуков (`use-selection`, `use-task-drag`, `use-context-menu`) и напрямую использует все хелперы из `src/helpers`.
- `src/components/task-list` и `src/components/task-item`: отвечают за строку таблицы, но завязаны на глобальные пропсы `TaskListProps`, которые прокидываются из `Gantt` без промежуточного слоя.
- `src/helpers`: содержит бизнес-логику (сортировки, расчёт координат, зависимостей, tooltip), но не группируется по доменам. Любой компонент может напрямую импортировать любой helper.
- `src/types`: все типы (публичные и внутренние) экспортируются единым barrel, поэтому любая часть UI может опираться на приватные структуры.
- Сторонние слои (`gantt-theme`, `gantt-locale`, `other/*`) подключаются в `Gantt` напрямую, без контекста или провайдера состояния.

Вывод: текущее дерево компонентов плоское, пропсы проходят через весь граф, что усложняет кастомизацию и переиспользование.

## 2. Публичный API и точки кастомизации

- Главный вход — `Gantt` (`src/index.tsx`) с пропами:
  - `tasks`, `columns`, `viewMode`, `viewDate`, `timeStep`, `comparisonLevels`.
  - Флаги поведения: `isMoveChildsWithParent`, `isUpdateDisabledParentsOnChange`, `isUnknownDates`, `isAdjustToWorkingDates`.
  - Настройки подкомпонентов через пропы `taskBar` и `taskList` (например `renderTopHeader`, `contextMenuOptions`, `TooltipContent`).
  - Коллбеки: `onCommitTasks`, `onAddTaskAction`, `onEditTaskAction`, `onSelectTaskIds`, `onWheel`.
  - Темы и локаль: `theme`, `locale`.
- Кастомизация баров и тултипов реализована через проп `taskBar.*`, но Tooltip — компонент верхнего уровня, а не самостоятельный провайдер.
- Контекстного API нет: кастомные компоненты не могут получить состояние диаграммы иначе как через проп-дриллинг или пользовательские коллбеки.

## 3. Болевые точки

1. **Проп-дриллинг**: `Gantt` формирует десятки пропов (`renderTaskBarProps`, `renderTaskListProps`), которые передаются глубоко в дерево. Любое изменение требует обновления большого количества сигнатур.
2. **Стили**: большинство компонентов тянет `.module.css`. Нет единой темы (несмотря на `GanttThemeProvider`), токены разбросаны.
3. **Смешение доменов**: функциональность (relations, selection, tooltip, drag, holidays) перемешана в `gantt.tsx`. Сложно отключить отдельный блок или переиспользовать его в кастомном UI.
4. **Производительность**: виртуализация реализована хелпером `useOptimizedList`, но остальные вычисления (dependency map, critical path) пересчитываются при любом изменении props.
5. **Отсутствие новой функциональности**: нет слоя для «заморозки дат», tooltip не расширяемый, нет контекстной API для кастомных компонентов.

## 4. Целевое состояние (переиспользуемая структура)

### Слои

1. `GanttRoot` — отвечает за загрузку/нормализацию задач, настройку провайдеров темы/локали, первичную мемоизацию helpers.
2. `GanttStateProvider` — React Context, который хранит:
   - `tasks`, `selection`, `zoom`, `viewDate`, `frozenDates`,
   - вычисленные карты (`mapTaskToCoordinates`, `dependencyMap`),
   - действия (`onCommitTasks`, drag/drop, selection).
3. Визуальные слои:
   - `TaskBoard` (SVG и overlay с tooltip),
   - `TaskListPanel` (таблица + ресайз колонок),
   - `Controls` (тулбары, кнопки, масштаб),
   - `Overlays` (relations, baseline, freeze layer).

Каждый слой подписывается на контекст через селектор-хуки (например `useGanttSelection`, `useGanttLayout`), что устраняет прокидывание пропсов.

### Темизация

- `src/components/gantt-theme` превращается в набор токенов (`theme.tokens.ts`) + React контекст `GanttThemeContext`.
- Стили компонентов переводятся на CSS Modules или scoped styles, которые читают CSS custom properties из темы.
- Пользователь может передать `theme` или `themeProvider` для глубокой кастомизации.

### API кастомизации

- Новый проп `components` с optional renderers: `taskBar`, `taskRow`, `tooltip`, `headers`, `controls`.
- Проп `features` включает/отключает слои (`relations`, `baseline`, `groups`, `freeze`, `todayLine`, `selection`).
- Хуки: `useRelations`, `useBaseline`, `useGroups`, `useZoom`, `useFreezeDates`. Каждый хук инкапсулирует соответствующие helpers и предоставляет API для кастомных компонентов.

### Функция «заморозка дат»

- Добавляется проп `frozenDates: Array<{ start: Date; end: Date }>` и флаг `calculateFrozenDates`.
- Если `calculateFrozenDates = true`, слой `useFreezeDates` вычисляет смещения и вычитает их из план/факт при расчёте координат и длины задач.
- Если `false`, библиотека использует предоставленные смещения без пересчёта.
- В `TaskBoard` появляется `FreezeLayer`, который подсвечивает таймлайн светло-синими полосами и отключает взаимодействия в этих диапазонах.

### Tooltip

- Общий `TooltipProvider` в корне Gantt, управляющий порталом и позиционированием (использует существующий `useTaskTooltip`).
- Пользователь может заменить `components.tooltip`, передав собственный React-компонент, который получает `task`, `coords`, `context`.

## 5. Публичные контракты, требующие миграции

- `GanttProps.taskBar.TooltipContent` → `components.tooltip`.
- `taskList.contextMenuOptions`, `taskBar.renderTopHeader` и другие настройки переезжают в `components.*` и `features`.
- Новые пропы: `components`, `features`, `frozenDates`, `calculateFrozenDates`.
- Новые контексты (`GanttStateContext`, `GanttThemeContext`), к которым можно подключаться через хуки для продвинутой кастомизации.

## 6. Следующие шаги

1. Вынести токены темы и подготовить API (`todo: theme`).
2. Реализовать `GanttStateProvider` и базовые селектор-хуки.
3. Модульный `components`/`features` API и хуки доменов (`relations`, `baseline`, `freeze`, `zoom`).
4. Оптимизации вычислений (кэширование helpers, виртуализация).
5. Freeze layer + TooltipProvider + документация/Storybook.

