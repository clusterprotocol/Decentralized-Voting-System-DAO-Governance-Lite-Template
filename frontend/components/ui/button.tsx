import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gradient' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    // Base classes
    const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-syne";
    
    // Variant classes
    const variantClasses = {
      default: "bg-dao-neonPurple text-white hover:bg-dao-neonPurple/90 hover:shadow-[0_0_15px_rgba(138,43,226,0.7)]",
      gradient: "bg-gradient-to-r from-dao-neonPurple to-dao-lightPurple text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.7)]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(239,68,68,0.7)]",
      outline: "border border-dao-neonPurple bg-transparent text-dao-neonPurple hover:bg-dao-neonPurple/10 hover:shadow-[0_0_15px_rgba(138,43,226,0.5)]",
      secondary: "bg-dao-darkPurple text-white hover:bg-dao-darkPurple/80 hover:shadow-[0_0_15px_rgba(47,29,96,0.7)]",
      ghost: "text-dao-lightPurple hover:bg-dao-darkPurple/50 hover:text-white",
      link: "text-dao-lightBlue underline-offset-4 hover:underline hover:text-dao-lightBlue/90"
    };
    
    // Size classes
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-xs",
      lg: "h-12 rounded-md px-8 text-base",
      icon: "h-10 w-10 p-2"
    };
    
    const variantClass = variantClasses[variant] || variantClasses.default;
    const sizeClass = sizeClasses[size] || sizeClasses.default;

    return (
      <button
        className={cn(baseClasses, variantClass, sizeClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

// Simple function to combine class strings for button variants
const buttonVariants = (options: {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}) => {
  const { variant = 'default', size = 'default', className = '' } = options;
  
  // Base classes
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-syne";
  
  // Variant classes
  const variantClasses = {
    default: "bg-dao-neonPurple text-white hover:bg-dao-neonPurple/90 hover:shadow-[0_0_15px_rgba(138,43,226,0.7)]",
    gradient: "bg-gradient-to-r from-dao-neonPurple to-dao-lightPurple text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.7)]",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(239,68,68,0.7)]",
    outline: "border border-dao-neonPurple bg-transparent text-dao-neonPurple hover:bg-dao-neonPurple/10 hover:shadow-[0_0_15px_rgba(138,43,226,0.5)]",
    secondary: "bg-dao-darkPurple text-white hover:bg-dao-darkPurple/80 hover:shadow-[0_0_15px_rgba(47,29,96,0.7)]",
    ghost: "text-dao-lightPurple hover:bg-dao-darkPurple/50 hover:text-white",
    link: "text-dao-lightBlue underline-offset-4 hover:underline hover:text-dao-lightBlue/90"
  };
  
  // Size classes
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-10 w-10 p-2"
  };
  
  const variantClass = variantClasses[variant] || variantClasses.default;
  const sizeClass = sizeClasses[size] || sizeClasses.default;
  
  return cn(baseClasses, variantClass, sizeClass, className);
};

export { Button, buttonVariants }
