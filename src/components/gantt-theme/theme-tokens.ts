import { CSSProperties } from "react";

import { ColorStyles, GanttTheme } from "../../types";

type ColorTokenKey = keyof ColorStyles;

type ColorTokenMap = Record<ColorTokenKey, `--${string}`>;

const COLOR_TOKEN_MAP: ColorTokenMap = {
  backgroundColor: "--gantt-background-color",
  arrowColor: "--gantt-arrow-color",
  arrowRelationColor: "--gantt-arrow-relation-color",
  arrowHoverColor: "--gantt-arrow-hover-color",
  arrowCriticalColor: "--gantt-arrow-critical-color",

  loadingPrimaryColor: "--gantt-loading-primary-color",
  loadingSecondaryColor: "--gantt-loading-secondary-color",

  dividerColor: "--gantt-divider-color",
  primaryTextColor: "--gantt-primary-text-color",
  secondaryTextColor: "--gantt-secondary-text-color",
  hoverFilter: "--gantt-hover-filter",

  calendarTodayColor: "--gantt-calendar-today-color",
  calendarHolidayColor: "--gantt-calendar-holiday-color",
  calendarStrokeColor: "--gantt-calendar-stroke-color",

  scrollbarThumbColor: "--gantt-scrollbar-thumb-color",

  tableHoverActionColor: "--gantt-table-hover-action-color",
  tableActionColor: "--gantt-table-action-color",
  tableDragIndicatorColor: "--gantt-table-drag-indicator-color",
  tableEvenBackgroundColor: "--gantt-table-even-background-color",
  tableSelectedTaskBackgroundColor: "--gantt-table-selected-task-background-color",
  tableDragTaskBackgroundColor: "--gantt-table-drag-task-background-color",

  contextMenuBgColor: "--gantt-context-menu-bg-color",
  contextMenuTextColor: "--gantt-context-menu-text-color",
  contextMenuBoxShadow: "--gantt-context-menu-box-shadow",
  tooltipBoxShadow: "--gantt-tooltip-box-shadow",

  barComparisonDefaultColor: "--gantt-bar-comparison-default-color",
  barComparisonPlanColor: "--gantt-bar-comparison-plan-color",
  barComparisonWarningColor: "--gantt-bar-comparison-warning-color",
  barComparisonCriticalColor: "--gantt-bar-comparison-critical-color",

  barProgressColor: "--gantt-bar-progress-color",
  barHandleColor: "--gantt-bar-handle-color",
  barProgressCriticalColor: "--gantt-bar-progress-critical-color",
  barProgressSelectedCriticalColor: "--gantt-bar-progress-selected-critical-color",
  barProgressSelectedColor: "--gantt-bar-progress-selected-color",

  barBackgroundSelectedCriticalColor: "--gantt-bar-background-selected-critical-color",
  barBackgroundCriticalColor: "--gantt-bar-background-critical-color",
  barBackgroundSelectedColor: "--gantt-bar-background-selected-color",
  barBackgroundColor: "--gantt-bar-background-color",

  groupProgressSelectedCriticalColor: "--gantt-group-progress-selected-critical-color",
  groupProgressCriticalColor: "--gantt-group-progress-critical-color",
  groupProgressSelectedColor: "--gantt-group-progress-selected-color",
  groupProgressColor: "--gantt-group-progress-color",

  groupBackgroundSelectedCriticalColor: "--gantt-group-background-selected-critical-color",
  groupBackgroundCriticalColor: "--gantt-group-background-critical-color",
  groupBackgroundSelectedColor: "--gantt-group-background-selected-color",
  groupBackgroundColor: "--gantt-group-background-color",

  projectProgressSelectedCriticalColor: "--gantt-project-progress-selected-critical-color",
  projectProgressCriticalColor: "--gantt-project-progress-critical-color",
  projectProgressSelectedColor: "--gantt-project-progress-selected-color",
  projectProgressColor: "--gantt-project-progress-color",

  projectBackgroundSelectedCriticalColor: "--gantt-project-background-selected-critical-color",
  projectBackgroundCriticalColor: "--gantt-project-background-critical-color",
  projectBackgroundSelectedColor: "--gantt-project-background-selected-color",
  projectBackgroundColor: "--gantt-project-background-color",

  milestoneBackgroundSelectedCriticalColor: "--gantt-milestone-background-selected-critical-color",
  milestoneBackgroundCriticalColor: "--gantt-milestone-background-critical-color",
  milestoneBackgroundSelectedColor: "--gantt-milestone-background-selected-color",
  milestoneBackgroundColor: "--gantt-milestone-background-color",

  freezeBackgroundColor: "--gantt-freeze-background-color",
  freezeStripeColor: "--gantt-freeze-stripe-color",
};

export type ThemeCssVariables = CSSProperties;

export const themeToCssVariables = (theme: GanttTheme): ThemeCssVariables => {
  const cssVariables: ThemeCssVariables = {};

  (Object.keys(COLOR_TOKEN_MAP) as ColorTokenKey[]).forEach(colorKey => {
    cssVariables[COLOR_TOKEN_MAP[colorKey]] = theme.colors[colorKey];
  });

  cssVariables["--gantt-font-family"] = theme.typography.fontFamily;
  cssVariables["--gantt-font-size"] = theme.typography.fontSize;
  cssVariables["--gantt-shape-border-radius"] = theme.shape.borderRadius;
  cssVariables["--gantt-table-drag-column-width"] = "26px";

  return cssVariables;
};

