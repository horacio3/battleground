"use client";

import { useEffect, useRef } from "react";

/**
 * This hook is used for debugging purposes only.
 * It traces updates to component props and logs the changes to the console.
 *
 * @param props - The component props to trace
 *
 * @example
 * function MyComponent(props) {
 *   useTraceUpdate(props);
 *   // ... rest of component logic
 * }
 *
 * @remarks
 * This hook should be removed or disabled in production builds.
 */
export function useTraceUpdate(props: any) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps: any, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      console.log("Changed props:", changedProps);
    }
    prev.current = props;
  });
}
