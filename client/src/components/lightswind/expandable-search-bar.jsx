import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function ExpandableSearchBar({
  placeholder,
  expandedWidth = '20rem',
  value,
  onChange,
  onSubmit,
  id,
  name,
  className = '',
  ...props
}) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder || t('Search...');
  const [focused, setFocused] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        if (onSubmit) {
          e.preventDefault();
          onSubmit(e);
        }
      }}
      className={`flex items-center ${className}`}
    >
      <label htmlFor={id || name} className="sr-only">
        {resolvedPlaceholder}
      </label>
      <input
        type="search"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={resolvedPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={resolvedPlaceholder}
        style={{ '--expanded-width': expandedWidth }}
        className="w-full min-w-[14rem] transition-all duration-300 ease-in-out px-4 py-3 rounded-full border border-gray-300 bg-white text-base text-gray-900 focus:border-red-500 focus:ring-4 focus:ring-red-200 outline-none shadow-sm"
        {...props}
      />
    </form>
  );
}
