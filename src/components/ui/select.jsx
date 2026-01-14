import * as React from "react"

const Select = ({ children }) => <div className="relative inline-block w-full">{children}</div>
const SelectGroup = ({ children }) => <>{children}</>
const SelectValue = ({ placeholder }) => <span>{placeholder}</span>
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <button ref={ref} className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`} {...props}>
    {children}
  </button>
))
SelectTrigger.displayName = "SelectTrigger"
const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md ${className}`} {...props}>
    <div className="p-1">{children}</div>
  </div>
))
SelectContent.displayName = "SelectContent"
const SelectLabel = ({ className, ...props }) => <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold ${className}`} {...props} />
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className}`} {...props}>
    <span className="truncate">{children}</span>
  </div>
))
SelectItem.displayName = "SelectItem"
const SelectSeparator = () => <hr />

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }
