import * as React from "react"

const Slider = React.forwardRef(({ className, min = 0, max = 100, step = 1, value = [0], onValueChange, ...props }, ref) => {
  const handleChange = (e) => {
    if (onValueChange) {
      onValueChange([parseFloat(e.target.value)])
    }
  }
  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value ? value[0] : 0}
        onChange={handleChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
        {...props}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }
