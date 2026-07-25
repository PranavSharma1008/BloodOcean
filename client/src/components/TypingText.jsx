import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "./lib/utils";

const TypingText = ({
  children,
  as: Component = "div",
  className = "",
  delay = 0,
  duration = 2,
  fontSize = "text-4xl",
  fontWeight = "font-bold",
  color = "text-white",
  letterSpacing = "tracking-wide",
  align = "left",
}) => {
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    const extractText = (node) => {
      if (typeof node === "string" || typeof node === "number") {
        return node.toString();
      }
      if (Array.isArray(node)) {
        return node.map(extractText).join("");
      }
      if (node?.props?.children) {
        return extractText(node.props.children);
      }
      return "";
    };
    setTextContent(extractText(children));
  }, [children]);

  const words = textContent.split(" ");
  const totalChars = textContent.length || 1;

  return (
    <Component
      className={cn(
        "flex flex-wrap gap-x-[0.25em] leading-tight",
        className,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        align === "center"
          ? "justify-center text-center"
          : align === "right"
          ? "justify-end text-right"
          : "justify-start text-left"
      )}
    >
      {words.map((word, wordIdx) => (
        <motion.span
          key={`${word}-${wordIdx}`}
          className="inline-block whitespace-nowrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + wordIdx * 0.08,
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
};

export default TypingText;
