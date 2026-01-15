import * as React from "react"
import { Check, ChevronDown } from "lucide-react" 
import { cn } from "@/lib/utils"

const SelectContext = React.createContext({ open: false, setOpen: () => {} })

const Select = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <SelectContext.Provider value={{ open, setOpen }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }) => <>{children}</>

const SelectValue = ({ placeholder }) => <span className="pointer-events-none">{placeholder}</span>

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      // STYLE OVERRIDE: Forces background to #f9fafb (Gray-50) and text to #111827 (Gray-900)
      style={{ backgroundColor: '#f9fafb', color: '#111827' }}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" color="#111827" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const { open } = React.useContext(SelectContext)
  if (!open) return null
  
  return (
    <div
      ref={ref}
      // STYLE OVERRIDE: Forces dropdown list to match
      style={{ backgroundColor: '#f9fafb', color: '#111827', top: "100%", marginTop: "5px", width: "100%" }}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md animate-in fade-in-80",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
))
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => {
   const { setOpen } = React.useContext(SelectContext)
   const [isHovered, setIsHovered] = React.useState(false);

   return (
    <div
      ref={ref}
      onClick={() => setOpen(false)} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // STYLE OVERRIDE: Handle hover state manually to ensure visibility
      style={{ 
        backgroundColor: isHovered ? '#e5e7eb' : 'transparent', // Light gray on hover
        cursor: 'pointer' 
      }}
      className={cn(
        "relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {/* Checkmark logic could go here */}
      </span>
      <span className="truncate">{children}</span>
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}