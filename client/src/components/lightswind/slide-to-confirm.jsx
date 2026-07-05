import React, { useState, useRef } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/components/lib/utils";

export function SlideToConfirm({
  text = "Slide to confirm",
  successText = "Confirmed",
  onConfirm,
  width = 320,
  height = 56,
  variant = "default",
  className,
}) {
  const [state, setState] = useState("idle");
  const containerRef = useRef(null);
  const trackWidth = width - height;
  const thumbSize = height - 8;

  const destructive = variant === "destructive";

  const x = useMotionValue(0);
  const controls = useAnimation();

  const textOpacity = useTransform(x, [0, trackWidth * 0.5], [1, 0]);
  const bgWidth = useTransform(x, [0, trackWidth], [height, width]);

  const successColor = destructive ? "#ef4444" : "#22c55e";
  const primaryColor = destructive ? "#ef4444" : "#DC2626";

  const handleDragEnd = async () => {
    if (state !== "idle") return;

    if (x.get() >= trackWidth * 0.9) {
      controls.start({ x: trackWidth, transition: { type: "spring", stiffness: 400, damping: 30 } });
      setState("loading");

      try {
        await onConfirm();
        setState("success");
      } catch (error) {
        setState("idle");
        controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
      }
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };

  const handleReset = () => {
    if (state === "success") {
      setState("idle");
      x.set(0);
      controls.start({ x: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border select-none",
        destructive
          ? "bg-red-50 border-red-200"
          : "bg-gray-100",
        state === "success"
          ? destructive ? "cursor-pointer border-red-500/50" : "cursor-pointer border-green-500/50"
          : "",
        className
      )}
      style={{ width, height }}
      onClick={handleReset}
    >
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: state === "success" ? width : bgWidth,
          backgroundColor: state === "success" ? successColor : primaryColor,
          opacity: state === "success" ? 0.15 : 0.08,
        }}
        animate={{ width: state === "success" ? width : undefined }}
        transition={{ duration: 0.3 }}
      />

      <motion.span
        className={cn(
          "absolute font-medium text-sm z-0",
          state === "success"
            ? destructive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            : destructive ? "text-red-500" : "text-gray-500"
        )}
        style={{ opacity: state === "idle" ? textOpacity : 0 }}
      >
        {text}
      </motion.span>

      <motion.span
        className={cn(
          "absolute font-medium text-sm z-0",
          destructive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: state === "success" ? 1 : 0,
          y: state === "success" ? 0 : 10
        }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {successText}
      </motion.span>

      <motion.div
        drag={state === "idle" ? "x" : false}
        dragConstraints={{ left: 0, right: trackWidth }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className={cn(
          "absolute left-1 z-10 flex cursor-grab items-center justify-center rounded-full shadow-md active:cursor-grabbing",
          destructive ? "bg-red-500 text-white" : "bg-white",
          state !== "idle" && "cursor-default"
        )}
        initial={false}
        whileTap={{ scale: state === "idle" ? 0.95 : 1 }}
        animate={
          state === "success"
            ? { x: trackWidth, backgroundColor: successColor, color: "white" }
            : controls
        }
        style={{ width: thumbSize, height: thumbSize, x }}
      >
        <motion.div
          animate={{
            rotate: state === "loading" ? 360 : 0,
            scale: state === "idle" ? 1 : 0,
            opacity: state === "idle" ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          {destructive ? (
            <X className="h-5 w-5 opacity-90" />
          ) : (
            <ArrowRight className="h-5 w-5 opacity-70" />
          )}
        </motion.div>

        <motion.div
          animate={{
            scale: state === "loading" ? 1 : 0,
            opacity: state === "loading" ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute flex h-full w-full items-center justify-center"
        >
          <div className="relative h-[20px] w-[20px]">
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute left-[9px] top-0 h-[5.5px] w-[1.8px] rounded-full bg-current"
                style={{
                  rotate: i * 30,
                  transformOrigin: "center 10px",
                }}
                animate={{
                  opacity: [0.15, 1, 0.15],
                }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.091,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{
            scale: state === "success" ? 1 : 0,
            opacity: state === "success" ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute text-white"
        >
          {destructive ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
        </motion.div>
      </motion.div>
    </div>
  );
}
