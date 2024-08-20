import { forwardRef, memo, PropsWithChildren } from "react";

import styles from "./bar-relation.module.css";

interface Props extends PropsWithChildren {
  className?: string;
}

const BarRelationWrapperInner = forwardRef<SVGGElement, Props>(({ className, children }, ref) => {
  return (
    <g
      ref={ref}
      tabIndex={0}
      className={`${styles.barRelationHandleWrapper} ${className || ""}`}
    >
      {children}
    </g>
  );
});

export const BarRelationWrapper = memo(BarRelationWrapperInner);
export * from "./bar-relation-handle";
