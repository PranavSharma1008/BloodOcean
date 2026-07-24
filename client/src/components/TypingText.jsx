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
      {words.map((word, wordIdx) => {
        const charOffset = words.slice(0, wordIdx).join(" ").length + (wordIdx > 0 ? 1 : 0);
        return (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {word.split("").map((char, charIdx) => {
              const globalIndex = charOffset + charIdx;
              return (
                <motion.span
                  key={`${char}-${charIdx}`}
                  className="inline-block"
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: (i) => ({
                      opacity: 1,
                      scale: 1,
                      transition: {
                        delay: delay + i * (duration / totalChars),
                        duration: 0.25,
                        ease: "easeInOut",
                      },
                    }),
                  }}
                  custom={globalIndex}
                  initial="hidden"
                  animate="visible"
                >
                  {char}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </Component>
  );
};

export default TypingText;
