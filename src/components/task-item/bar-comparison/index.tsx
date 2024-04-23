import React from "react";

import { TaskComparisonDatesCoordinates } from "../../../types";

interface Props extends TaskComparisonDatesCoordinates {}

export const BarComparison: React.FC<Props> = ({ x, y, width }) => {
  return (
    <rect
      x={x}
      width={width}
      y={y}
      height={12}
      ry={4}
      rx={4}
      fill={"var(--gantt-group-background-selected-critical-color)"}
      style={{
        userSelect: "none",
        strokeWidth: 0,
      }}
    />
  );
};
