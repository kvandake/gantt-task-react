import React, { createContext, CSSProperties, ReactNode, useContext, useMemo } from "react";

import { GanttTheme } from "../../types";
import { themeToCssVariables, ThemeCssVariables } from "./theme-tokens";

const GanttThemeContext = createContext<GanttTheme>({} as GanttTheme);
const GanttThemeTokensContext = createContext<ThemeCssVariables>({});

export interface GanttThemeProps {
  theme: GanttTheme;
  children: ReactNode | ((cssVars: CSSProperties) => ReactNode);
}

export const GanttThemeProvider: React.FC<GanttThemeProps> = ({
  children,
  theme,
}) => {
  const ganttCssVariables = useMemo(() => themeToCssVariables(theme), [theme]);

  const renderedChildren =
    typeof children === "function" ? children(ganttCssVariables) : children;

  return (
    <GanttThemeContext.Provider value={theme}>
      <GanttThemeTokensContext.Provider value={ganttCssVariables}>
        {renderedChildren}
      </GanttThemeTokensContext.Provider>
    </GanttThemeContext.Provider>
  );
};

export * from "./gantt-theme-builder";
export * from "./theme-tokens";

export const useGanttTheme = () => useContext(GanttThemeContext);
export const useGanttThemeTokens = () => useContext(GanttThemeTokensContext);
