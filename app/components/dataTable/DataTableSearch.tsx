import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = "Search...",
}: DataTableSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef(true);

  // Only sync when value is externally cleared (e.g., reset button)
  // This prevents the re-render loop that causes focus loss
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Only sync if value was cleared externally
    if (value === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [value, localValue]);

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    // Focus back on input after clearing
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-8 pr-8"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 h-full -translate-y-1/2 px-2 hover:bg-transparent"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
