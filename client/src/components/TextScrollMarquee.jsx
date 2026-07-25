import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from './lib/utils';

const TextScrollMarquee = ({
  children,
  baseVelocity = 25,
  className,
  delay = 300,
}) => {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="overflow-hidden whitespace-nowrap flex w-full relative select-none py-1">
      <motion.div
        className={cn('inline-flex items-center gap-6 whitespace-nowrap', className)}
        animate={started ? { x: ['-50%', '0%'] } : {}}
        transition={{
          duration: baseVelocity,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <span className="inline-block">{children}</span>
        <span className="opacity-60 text-xs">•</span>
        <span className="inline-block">{children}</span>
        <span className="opacity-60 text-xs">•</span>
        <span className="inline-block">{children}</span>
        <span className="opacity-60 text-xs">•</span>
        <span className="inline-block">{children}</span>
        <span className="opacity-60 text-xs">•</span>
      </motion.div>
    </div>
  );
};

export default TextScrollMarquee;
