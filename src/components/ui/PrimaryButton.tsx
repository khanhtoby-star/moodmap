import type { ButtonHTMLAttributes, ReactNode } from 'react'

type PrimaryButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  icon?: ReactNode
  variant?: 'dark' | 'green'
}

export function PrimaryButton({
  label,
  icon,
  variant = 'dark',
  className = '',
  ...props
}: PrimaryButtonProps) {
  const variantClassName = variant === 'green'
    ? 'bg-[#3d8a5c] hover:bg-[#2e744a]'
    : 'bg-[#173c2c] hover:bg-[#245740]'

  return (
    <button
      {...props}
      className={`flex items-center gap-2 rounded-xl font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${variantClassName} ${className}`}
    >
      {label}
      {icon}
    </button>
  )
}