import React, { useMemo } from "react";
import styles from "./bar-comparison.module.css";
import { TaskComparisonDatesCoordinates } from "../../../types";

interface Props extends Omit<TaskComparisonDatesCoordinates, "x" | "y"> {
  barCornerRadius: number;
  isWarning?: boolean;
  isPlan?: boolean;
  isCritical?: boolean;
}

export const BarComparison: React.FC<Props> = props => {
  const { barCornerRadius, isWarning, isPlan, isCritical, width, height } =
    props;
  const lineHeight = useMemo(() => Math.max(height, 4), [height]);

  const barColor = useMemo(() => {
    if (isPlan) {
      return "var(--gantt-bar-comparison-plan-color)";
    }
    if (isCritical) {
      return "var(--gantt-bar-comparison-critical-color)";
    }

    if (isWarning) {
      return "var(--gantt-bar-comparison-warning-color)";
    }
    return "var(--gantt-bar-comparison-default-color)";
  }, [isCritical, isPlan, isWarning]);

  return (
    <g>
      <rect
        x={0}
        width={width}
        y={lineHeight}
        height={height}
        ry={barCornerRadius}
        rx={barCornerRadius}
        fill={barColor}
        className={styles.barComparison}
      />
      <rect
        x={0}
        fill={barColor}
        y={lineHeight * 0.5}
        width={height}
        height={lineHeight}
      />
      <rect
        x={width - height}
        fill={barColor}
        y={lineHeight * 0.5}
        width={height}
        height={lineHeight}
      />
    </g>
  );
};
