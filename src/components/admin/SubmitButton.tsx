"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SubmitButton({ children, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-maroon-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
      {...props}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
