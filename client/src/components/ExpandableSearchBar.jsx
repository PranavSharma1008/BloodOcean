import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from './lib/utils';

const ExpandableSearchBar = ({
  placeholder = 'Search...',
  onChange,
  onSubmit,
  className,
  expandedWidth = '18rem',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        value === ''
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  const handleClear = () => {
    setValue('');
    if (onChange) onChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative flex items-center justify-end', className)}
      style={{ width: isExpanded ? expandedWidth : '2.5rem' }}
    >
      <motion.form
        initial={false}
        animate={{
          width: isExpanded ? expandedWidth : '2.5rem',
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        onSubmit={handleSubmit}
        className={cn(
          'relative flex h-10 items-center overflow-hidden rounded-full border shadow-sm transition-colors',
          isExpanded
            ? 'border-white/20 bg-white/15'
            : 'border-transparent bg-white/10 hover:bg-white/15 cursor-pointer'
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <button
          type="button"
          className="absolute left-0 flex h-full w-10 items-center justify-center text-white/60 hover:text-white z-10"
          onClick={() => {
            if (isExpanded && value === '') {
              setIsExpanded(false);
            } else if (!isExpanded) {
              setIsExpanded(true);
            }
          }}
          aria-label="Search"
          disabled={isExpanded && value !== ''}
        >
          <Search className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="h-full w-full border-none bg-transparent pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/40"
          style={{
            pointerEvents: isExpanded ? 'auto' : 'none',
            opacity: isExpanded ? 1 : 0,
          }}
          tabIndex={isExpanded ? 0 : -1}
        />

        <AnimatePresence>
          {isExpanded && value !== '' && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className="absolute right-0 flex h-full w-10 items-center justify-center text-white/60 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
};

export default ExpandableSearchBar;
