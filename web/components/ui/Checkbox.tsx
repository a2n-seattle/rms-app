import { forwardRef } from "react"

export const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
    props,
    ref
) {
    return <input ref={ref} type="checkbox" {...props} />
})
