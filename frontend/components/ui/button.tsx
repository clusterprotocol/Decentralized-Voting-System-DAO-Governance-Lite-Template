import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-syne",
  {
    variants: {
      variant: {
        default: "bg-dao-neonPurple text-white hover:bg-dao-neonPurple/90 hover:shadow-[0_0_15px_rgba(138,43,226,0.7)]",
        gradient: "bg-gradient-to-r from-dao-neonPurple to-dao-lightPurple text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.7)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(239,68,68,0.7)]",
        outline:
          "border border-dao-neonPurple bg-transparent text-dao-neonPurple hover:bg-dao-neonPurple/10 hover:shadow-[0_0_15px_rgba(138,43,226,0.5)]",
        secondary:
          "bg-dao-darkPurple text-white hover:bg-dao-darkPurple/80 hover:shadow-[0_0_15px_rgba(47,29,96,0.7)]",
        ghost: "text-dao-lightPurple hover:bg-dao-darkPurple/50 hover:text-white",
        link: "text-dao-lightBlue underline-offset-4 hover:underline hover:text-dao-lightBlue/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
