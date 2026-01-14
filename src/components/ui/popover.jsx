import * as React from "react"

const Popover = ({ children }) => <div className="relative inline-block">{children}</div>
const PopoverTrigger = ({ children, ...props }) => <div {...props}>{children}</div>
const PopoverContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className}`} {...props} />
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
