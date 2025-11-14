import * as React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, ...props }, ref) => (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        className="peer appearance-none w-4 h-4 border border-gray-300 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        {...props}
      />
      <span className="ml-[-1.5rem] w-4 h-4 flex items-center justify-center pointer-events-none">
        {checked && <Check className="h-3 w-3 text-white" />}
      </span>
    </label>
  )
);
Checkbox.displayName = "Checkbox";
