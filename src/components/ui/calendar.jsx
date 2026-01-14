import * as React from "react"

// A simplified calendar replacement using native input
function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <div className={`p-3 ${className}`}>
      <input 
        type="date" 
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
