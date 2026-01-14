import * as React from "react"

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={
        orientation === "horizontal"
          ? "h-[1px] w-full bg-border"
          : "h-full w-[1px] bg-border"
      }
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
