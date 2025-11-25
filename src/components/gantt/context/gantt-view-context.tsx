import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type {
  ChildByLevelMap,
  DependencyMap,
  DependentMap,
  Distances,
  FrozenDateRange,
  GanttFeaturesConfig,
  OnRelationChange,
  RenderTask,
  RootMapByLevel,
  Task,
  ViewMode,
} from "../../../types";

export interface GanttViewContextValue {
  childTasksMap: ChildByLevelMap;
  rootTasksMap: RootMapByLevel;
  dependencyMap: DependencyMap;
  dependentMap: DependentMap;
  visibleTasks: readonly RenderTask[];
  viewMode: ViewMode;
  distances: Distances;
  comparisonLevels: number;
  features: Required<GanttFeaturesConfig>;
  onRelationChange: OnRelationChange;
  scrollToTask: (task: Task) => void;
  frozenDates: readonly FrozenDateRange[];
  calculateFrozenDates: boolean;
}

const defaultFeatures: Required<GanttFeaturesConfig> = {
  relations: true,
  baseline: true,
  groups: true,
  freeze: true,
  tooltip: true,
};

const GanttViewContext = createContext<GanttViewContextValue | null>(null);

export interface GanttViewProviderProps {
  value: GanttViewContextValue;
  children: ReactNode;
}

export const GanttViewProvider = ({ value, children }: GanttViewProviderProps) => {
  return (
    <GanttViewContext.Provider
      value={{
        ...value,
        features: {
          ...defaultFeatures,
          ...value.features,
        },
      }}
    >
      {children}
    </GanttViewContext.Provider>
  );
};

const useGanttViewContext = (): GanttViewContextValue => {
  const context = useContext(GanttViewContext);

  if (!context) {
    throw new Error("useGanttViewContext must be used within GanttViewProvider");
  }

  return context;
};

export const useRelations = () => {
  const { dependencyMap, dependentMap, features, onRelationChange } =
    useGanttViewContext();

  return {
    dependencyMap,
    dependentMap,
    enabled: features.relations !== false,
    onRelationChange,
  };
};

export const useBaseline = () => {
  const { comparisonLevels, visibleTasks, features } = useGanttViewContext();

  return {
    comparisonLevels,
    visibleTasks,
    enabled: features.baseline !== false,
  };
};

export const useGroups = () => {
  const { childTasksMap, rootTasksMap, visibleTasks, features } =
    useGanttViewContext();

  return {
    childTasksMap,
    rootTasksMap,
    visibleTasks,
    enabled: features.groups !== false,
  };
};

export const useZoom = () => {
  const { viewMode, distances, scrollToTask } = useGanttViewContext();

  return {
    viewMode,
    columnWidth: distances.columnWidth,
    rowHeight: distances.rowHeight,
    scrollToTask,
  };
};

export const useFreezeDates = () => {
  const { frozenDates, calculateFrozenDates, features } = useGanttViewContext();

  return {
    frozenDates,
    calculateFrozenDates,
    enabled: features.freeze !== false,
  };
};

