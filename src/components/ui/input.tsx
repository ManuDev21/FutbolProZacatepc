import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 ' +
  'focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30 disabled:opacity-60 ' +
  'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(baseField, className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cn(baseField, 'appearance-auto', className)} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} rows={3} className={cn(baseField, className)} {...rest} />;
  },
);

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}
