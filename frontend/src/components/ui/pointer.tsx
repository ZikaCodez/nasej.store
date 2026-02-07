import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useMotionValue,
} from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A custom pointer component that displays an animated cursor.
 * Add this as a child to any component to enable a custom pointer when hovering.
 * You can pass custom children to render as the pointer.
 *
 * @component
 * @param {HTMLMotionProps<"div">} props - The component props
 */
export function Pointer({
  className,
  style,
  children,
  disableOnTouch = true,
  disabled = false,
  zIndex = 10,
  ...props
}: HTMLMotionProps<"div"> & {
  disableOnTouch?: boolean;
  disabled?: boolean;
  zIndex?: number;
}): React.ReactNode {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && containerRef.current) {
      if (disabled) return;
      // Get the parent element directly from the ref
      const parentElement = containerRef.current.parentElement;

      if (parentElement) {
        // Respect touch/coarse pointers: disable custom pointer
        if (disableOnTouch) {
          const isCoarse =
            window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
          if (isCoarse) return;
        }

        // Add cursor-none to parent while active
        parentElement.style.cursor = "none";

        // Add event listeners to parent
        const handleMouseMove = (e: MouseEvent) => {
          const rect = parentElement.getBoundingClientRect();
          x.set(e.clientX - rect.left);
          y.set(e.clientY - rect.top);
          setIsActive(true);
        };

        const handleMouseEnter = (e: MouseEvent) => {
          const rect = parentElement.getBoundingClientRect();
          x.set(e.clientX - rect.left);
          y.set(e.clientY - rect.top);
          setIsActive(true);
        };

        const handleMouseLeave = () => {
          setIsActive(false);
        };

        // Hide pointer during scroll/wheel/touchmove to prevent sticking
        const handleWheel = () => setIsActive(false);
        const handleTouchMove = () => setIsActive(false);

        parentElement.addEventListener("mousemove", handleMouseMove);
        parentElement.addEventListener("mouseenter", handleMouseEnter);
        parentElement.addEventListener("mouseleave", handleMouseLeave);
        parentElement.addEventListener("wheel", handleWheel, { passive: true });
        parentElement.addEventListener("touchmove", handleTouchMove, {
          passive: true,
        });

        return () => {
          parentElement.style.cursor = "";
          parentElement.removeEventListener("mousemove", handleMouseMove);
          parentElement.removeEventListener("mouseenter", handleMouseEnter);
          parentElement.removeEventListener("mouseleave", handleMouseLeave);
          parentElement.removeEventListener("wheel", handleWheel);
          parentElement.removeEventListener("touchmove", handleTouchMove);
        };
      }
    }
  }, [x, y, disabled, disableOnTouch]);

  return (
    <>
      <div ref={containerRef} />
      <AnimatePresence>
        {isActive && (
          <motion.div
            className={cn(
              "pointer-events-none absolute transform-[translate(-50%,-50%)]",
              className,
            )}
            style={{
              top: y,
              left: x,
              zIndex,
              ...style,
            }}
            initial={{
              scale: 0,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            {...props}>
            {children || (
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="1"
                viewBox="0 0 16 16"
                height="24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
                className={cn("rotate-[-70deg] stroke-white text-black")}>
                <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
