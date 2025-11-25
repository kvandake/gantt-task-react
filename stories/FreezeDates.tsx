import React, { useMemo } from "react";
import { addDays, startOfDay } from "date-fns";

import { Gantt, RenderTask, ViewMode } from "../src";
import { initTasks } from "./helper";

const STORY_CONTAINER_STYLE: React.CSSProperties = {
  display: "grid",
  gap: 32,
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  padding: 24,
};

const PANEL_STYLE: React.CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const GANTT_WRAPPER_STYLE: React.CSSProperties = {
  height: 420,
};

const buildFrozenRanges = () => {
  const base = startOfDay(new Date());

  return [
    {
      start: addDays(base, 3),
      end: addDays(base, 6),
    },
    {
      start: addDays(base, 5),
      end: addDays(base, 8),
    },
    {
      start: addDays(base, 12),
      end: addDays(base, 13),
    },
  ];
};

type FrozenPaneProps = {
  tasks: readonly RenderTask[];
  calculateFrozenDates: boolean;
  title: string;
};

const FrozenPane: React.FC<FrozenPaneProps> = ({
  tasks,
  calculateFrozenDates,
  title,
}) => {
  const frozenDates = useMemo(buildFrozenRanges, []);

  return (
    <div style={PANEL_STYLE}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginTop: 0, color: "#666", fontSize: 14 }}>
        {calculateFrozenDates
          ? "Клиент объединяет пересекающиеся периоды и рассчитывает смещения."
          : "Сервер возвращает готовые интервалы, Frontend лишь подсвечивает их."}
      </p>
      <div style={GANTT_WRAPPER_STYLE}>
        <Gantt
          tasks={tasks}
          frozenDates={frozenDates}
          calculateFrozenDates={calculateFrozenDates}
          viewMode={ViewMode.Day}
          features={{ freeze: true }}
        />
      </div>
    </div>
  );
};

export const FreezeDatesStory: React.FC = () => {
  const tasks = useMemo<readonly RenderTask[]>(() => initTasks(), []);

  return (
    <div style={STORY_CONTAINER_STYLE}>
      <FrozenPane
        tasks={tasks}
        calculateFrozenDates={true}
        title="Автоматический расчёт"
      />
      <FrozenPane
        tasks={tasks}
        calculateFrozenDates={false}
        title="Серверные смещения"
      />
    </div>
  );
};

