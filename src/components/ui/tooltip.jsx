import * as React from "react"

// Simple Context to handle hover state
const TooltipContext = React.createContext({
  open: false,
  setOpen: () => {},
})

const TooltipProvider = ({ children }) => <>{children}</>

const Tooltip = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef(({ children, ...props }, ref) => {
  const { setOpen } = React.useContext(TooltipContext)
  return (
    <div
      ref={ref}
      className="cursor-pointer"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => {
  const { open } = React.useContext(TooltipContext)
  
  if (!open) return null

  return (
    <div
      ref={ref}
      // Simple absolute positioning to make it show up above the element
      style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" }}
      className={`absolute z-50 overflow-hidden rounded-md border bg-black px-3 py-1.5 text-xs text-white shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
