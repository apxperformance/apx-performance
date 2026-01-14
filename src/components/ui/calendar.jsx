import * as React from "react"

function Calendar({ className, ...props }) {
  return (
    <div className={`p-3 ${className}`}>
      <input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
