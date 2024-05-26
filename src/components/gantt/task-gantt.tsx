import { CSSProperties, MouseEvent, RefObject, useEffect, useRef } from "react";
import React, { memo, SyntheticEvent, useMemo } from "react";

import { GanttToday, GanttTodayProps } from "../gantt-today";
import { Calendar, CalendarProps } from "../calendar/calendar";
import { TaskGanttContent, TaskGanttContentProps } from "./task-gantt-content";
import styles from "./gantt.module.css";
import { GanttTaskBarActions } from "../../types";

export interface TaskGanttProps extends GanttTaskBarActions {
  barProps: TaskGanttContentProps;
  calendarProps: Omit<CalendarProps, "scrollRef">;
  fullRowHeight: number;
  fullSvgWidth: number;
  ganttFullHeight: number;
  ganttHeight: number;
  ganttSVGRef: RefObject<SVGSVGElement>;
  ganttTodayProps: GanttTodayProps;
  horizontalContainerRef: RefObject<HTMLDivElement>;
  verticalScrollbarRef: RefObject<HTMLDivElement>;
  onVerticalScrollbarScrollX: (event: SyntheticEvent<HTMLDivElement>) => void;
  verticalGanttContainerRef: RefObject<HTMLDivElement>;
}

interface MouseDragState {
  scrollLeft: number;
  scrollTop: number;
  clientX: number;
  clientY: number;
}

const TaskGanttInner: React.FC<TaskGanttProps> = (props) => {
  const {
    barProps,
    barProps: { additionalLeftSpace },
    calendarProps,
    fullRowHeight,
    fullSvgWidth,
    ganttFullHeight,
    ganttHeight,
    ganttSVGRef,
    ganttTodayProps,
    ganttTodayProps: {
      distances: { columnWidth, rowHeight, minimumRowDisplayed },
    },
    horizontalContainerRef,
    onVerticalScrollbarScrollX,
    verticalGanttContainerRef,
    verticalScrollbarRef,
  }= props;
  const contentRef = React.useRef<SVGRectElement>(null);
  const moveStateVertRef = useRef<MouseDragState | null>(null);
  const moveStateHorRef = useRef<MouseDragState | null>(null);
  const moveStateScrollRef = useRef<MouseDragState | null>(null);

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      height: Math.max(ganttHeight, minimumRowDisplayed * rowHeight),
      width: fullSvgWidth,
    }),
    [ganttHeight, minimumRowDisplayed, rowHeight, fullSvgWidth],
  );

  const gridStyle = useMemo<CSSProperties>(
    () => ({
      height: Math.max(ganttFullHeight, minimumRowDisplayed * rowHeight),
      width: fullSvgWidth,
      backgroundSize: `${columnWidth}px ${fullRowHeight * 2}px`,
      backgroundPositionX: additionalLeftSpace || undefined,
      backgroundImage: [
        `linear-gradient(to right, #ebeff2 1px, transparent 2px)`,
        `linear-gradient(to bottom, transparent ${fullRowHeight}px, #f5f5f5 ${fullRowHeight}px)`,
      ].join(", "),
    }),
    [
      additionalLeftSpace,
      columnWidth,
      fullRowHeight,
      fullSvgWidth,
      ganttFullHeight,
      minimumRowDisplayed,
      rowHeight,
    ],
  );

  // https://stackoverflow.com/questions/40926181/react-scrolling-a-div-by-dragging-the-mouse
  useEffect(() => {
    if (!contentRef.current) {
      return () => {
      };
    }

    const contentContainer = contentRef.current;

    const onScrollStart = (event: MouseEvent) => {
      event.preventDefault();
      moveStateVertRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        scrollLeft: verticalGanttContainerRef.current.scrollLeft,
        scrollTop: verticalGanttContainerRef.current.scrollTop,
      };
      moveStateHorRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        scrollLeft: horizontalContainerRef.current.scrollLeft,
        scrollTop: horizontalContainerRef.current.scrollTop,
      };
      moveStateScrollRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        scrollLeft: verticalScrollbarRef.current.scrollLeft,
        scrollTop: verticalScrollbarRef.current.scrollTop,
      };
      contentContainer.classList.add(styles.calendarDragging);
    };

    const onScrollMove = (event: MouseEvent) => {
      if (!moveStateVertRef.current) {
        return;
      }

      event.preventDefault();
      const { clientX, scrollLeft, scrollTop, clientY } = moveStateVertRef.current;
      const scrollVertContainer = verticalGanttContainerRef.current;
      scrollVertContainer.scrollLeft = scrollLeft + clientX - event.clientX;
      scrollVertContainer.scrollTop = scrollTop + clientY - event.clientY;

      const {
        clientX: clientXH,
        scrollLeft: scrollLeftH,
        scrollTop: scrollTopH,
        clientY: clientYH,
      } = moveStateHorRef.current;
      const horContainer = horizontalContainerRef.current;
      horContainer.scrollLeft = scrollLeftH + clientXH - event.clientX;
      horContainer.scrollTop = scrollTopH + clientYH - event.clientY;

      const {
        clientX: clientXS,
        scrollLeft: scrollLeftS,
        scrollTop: scrollTopS,
        clientY: clientYS,
      } = moveStateScrollRef.current;
      const scrollContainer = verticalScrollbarRef.current;
      scrollContainer.scrollLeft = scrollLeftS + clientXS - event.clientX;
      scrollContainer.scrollTop = scrollTopS + clientYS - event.clientY;
    };

    const onScrollEnd = (event: MouseEvent) => {
      event.preventDefault();
      moveStateVertRef.current = null;
      moveStateHorRef.current = null;
      contentContainer.classList.remove(styles.calendarDragging);
    };

    contentContainer.addEventListener("mousemove", onScrollMove as any);
    contentContainer.addEventListener("mousedown", onScrollStart as any);
    contentContainer.addEventListener("mouseup", onScrollEnd as any);
    contentContainer.addEventListener("mouseout", onScrollEnd as any);

    return () => {
      contentContainer.removeEventListener("mousemove", onScrollMove as any);
      contentContainer.removeEventListener("mousedown", onScrollStart as any);
      contentContainer.removeEventListener("mouseup", onScrollEnd as any);
      contentContainer.removeEventListener("mouseout", onScrollEnd as any);
    };
  }, [verticalScrollbarRef, horizontalContainerRef, verticalGanttContainerRef]);

  return (
    <div
      className={styles.ganttVerticalContainer}
      ref={verticalGanttContainerRef}
      onScroll={onVerticalScrollbarScrollX}
      dir="ltr"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={fullSvgWidth}
        height={calendarProps.distances.headerHeight}
        fontFamily={"var(--gantt-font-family)"}
      >
        <Calendar scrollRef={verticalGanttContainerRef} {...calendarProps} />
      </svg>

      <div
        ref={horizontalContainerRef}
        className={styles.horizontalContainer}
        style={containerStyle}
      >
        <div style={gridStyle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={fullSvgWidth}
            height={ganttFullHeight}
            fontFamily={"var(--gantt-font-family)"}
            ref={ganttSVGRef}
          >
            <GanttToday {...ganttTodayProps} />
            <rect ref={contentRef} width={"100%"} height={"100%"} fill={"transparent"} />
            <TaskGanttContent {...barProps} />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const TaskGantt = memo(TaskGanttInner);
