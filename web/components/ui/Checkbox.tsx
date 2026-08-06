import { forwardRef } from "react"

export const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
    props,
    ref
) {
    return <input type="checkbox" ref={ref} {...props} />
})
