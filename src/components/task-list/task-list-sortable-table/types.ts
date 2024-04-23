import type { MutableRefObject } from "react";
import { RenderTask } from "../../../types";

export type SensorContext = MutableRefObject<{
  items: RenderTask[];
  offset: number;
}>;
