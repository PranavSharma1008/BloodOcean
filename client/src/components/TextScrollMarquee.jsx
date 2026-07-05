import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from './lib/utils';

const TextScrollMarquee = ({
  children,
  baseVelocity = 10,
  className,
  delay = 0,
}) => {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="overflow-hidden whitespace-nowrap flex flex-nowrap">
      <motion.span
        className={cn('block text-[5vw]', className)}
        initial={{ x: '0%' }}
        animate={started ? { x: ['0%', '100%'] } : {}}
        transition={{
          duration: baseVelocity,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {children}
      </motion.span>
    </div>
  );
};

export default TextScrollMarquee;
