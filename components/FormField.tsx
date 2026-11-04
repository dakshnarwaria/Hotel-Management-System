"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
};

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type SelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
  };

export function FormField({
  label,
  error,
  required = false,
  className = "",
  id,
  ...props
}: InputProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="form-field" htmlFor={fieldId}>
      <span className="field-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </span>
      <input
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`field-control ${className}`.trim()}
      />
      {error && (
        <span className="field-error" id={`${fieldId}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}

export function SelectField({
  label,
  error,
  required = false,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="form-field" htmlFor={fieldId}>
      <span className="field-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </span>
      <select
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`field-control ${className}`.trim()}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="field-error" id={`${fieldId}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}
