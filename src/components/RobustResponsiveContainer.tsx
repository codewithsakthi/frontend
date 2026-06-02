import React, { useState, useLayoutEffect, useRef } from "react";

interface RobustResponsiveContainerProps {
  width?: string | number;
  height?: string | number;
  minWidth?: number;
  minHeight?: number;
  children: React.ReactElement;
}

export function RobustResponsiveContainer({
  width = "100%",
  height = "100%",
  minWidth = 0,
  minHeight = 0,
  children,
}: RobustResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: observedWidth, height: observedHeight } = entries[0].contentRect;
      setDimensions({
        width: typeof width === "number" ? width : observedWidth,
        height: typeof height === "number" ? height : observedHeight,
      });
    });

    resizeObserver.observe(containerRef.current);

    // Initial measurement
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      width: typeof width === "number" ? width : rect.width,
      height: typeof height === "number" ? height : rect.height,
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  const targetWidth = typeof width === "number" ? width : Math.max(dimensions.width, minWidth);
  const targetHeight = typeof height === "number" ? height : Math.max(dimensions.height, minHeight);

  const shouldRender = targetWidth > 0 && targetHeight > 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{
        width: typeof width === "number" ? `${width}px` : "100%",
        height: typeof height === "number" ? `${height}px` : "100%",
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
      }}
    >
      {shouldRender &&
        React.cloneElement(children, {
          width: targetWidth,
          height: targetHeight,
        })}
    </div>
  );
}
