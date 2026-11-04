"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  onChange,
  placeholder = "Search...",
}: Props) {
  const [value, setValue] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const timer = window.setTimeout(() => onChange(value.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [value, onChange]);

  return (
    <label className="search-input">
      <Search size={17} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </label>
  );
}
