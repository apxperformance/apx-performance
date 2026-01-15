import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // FIX:
        // 1. bg-transparent: Lets the parent container's color show through (cleaner for search bars).
        // 2. !text-foreground: Forces text to be WHITE (in dark mode), overriding any rogue black text styles.
        "flex h-10 w-full rounded-md border border-input bg-transparent !text-foreground px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} 
    />
  )
})
Input.displayName = "Input"

export { Input }
