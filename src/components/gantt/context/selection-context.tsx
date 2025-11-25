import type { MouseEvent, ReactNode } from "react";
import { createContext, useContext } from "react";

import type { RenderTask } from "../../../types";

type SelectionHandler = (taskId: string, event: MouseEvent) => void;

export interface GanttSelectionContextValue {
  checkHasCopyTasks: () => boolean;
  checkHasCutTasks: () => boolean;
  copyIdsMirror: Readonly<Record<string, true>>;
  copySelectedTasks: () => void;
  copyTask: (task: RenderTask) => void;
  cutIdsMirror: Readonly<Record<string, true>>;
  cutSelectedTasks: () => void;
  cutTask: (task: RenderTask) => void;
  resetSelectedTasks: () => void;
  selectTaskOnMouseDown: SelectionHandler;
  selectedIdsMirror: Readonly<Record<string, true>>;
}

const SelectionContext = createContext<GanttSelectionContextValue | null>(null);

export interface GanttSelectionProviderProps {
  value: GanttSelectionContextValue;
  children: ReactNode;
}

export const GanttSelectionProvider = ({
  children,
  value,
}: GanttSelectionProviderProps) => {
  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useGanttSelection = (): GanttSelectionContextValue => {
  const context = useContext(SelectionContext);

  if (!context) {
    throw new Error("useGanttSelection must be used within GanttSelectionProvider");
  }

  return context;
};

