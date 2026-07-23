import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-lg border border-[var(--border-default)] bg-[var(--card-background)] p-4 shadow-[0_1px_2px_rgba(0,55,85,0.04)] ${className}`}>
      {children}
    </div>
  );
}
