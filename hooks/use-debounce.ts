import { useEffect, useState } from 'react';

export const useDebounce  = <T>(value: T, delay: number): T  => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if the value changes before the delay period
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}