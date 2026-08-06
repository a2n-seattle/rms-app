import { render, screen, fireEvent } from "@testing-library/react"
import { Modal } from "./Modal"

test("renders nothing when closed", () => {
    const { container } = render(
        <Modal open={false} onClose={jest.fn()} title="Test">
            <p>Content</p>
        </Modal>
    )
    expect(container.innerHTML).toBe("")
})

test("renders children and title when open", () => {
    render(
        <Modal open={true} onClose={jest.fn()} title="Test Modal">
            <p>Content</p>
        </Modal>
    )
    expect(screen.getByText("Content")).not.toBeNull()
    expect(screen.getByRole("dialog", { name: "Test Modal" })).not.toBeNull()
})

test("calls onClose when the backdrop is clicked", () => {
    const onClose = jest.fn()
    render(
        <Modal open={true} onClose={onClose} title="Test">
            <p>Content</p>
        </Modal>
    )

    fireEvent.click(screen.getByRole("dialog").parentElement!)

    expect(onClose).toHaveBeenCalledTimes(1)
})

test("does not call onClose when the panel itself is clicked", () => {
    const onClose = jest.fn()
    render(
        <Modal open={true} onClose={onClose} title="Test">
            <p>Content</p>
        </Modal>
    )

    fireEvent.click(screen.getByRole("dialog"))

    expect(onClose).not.toHaveBeenCalled()
})

test("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn()
    render(
        <Modal open={true} onClose={onClose} title="Test">
            <p>Content</p>
        </Modal>
    )

    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(onClose).toHaveBeenCalledTimes(1)
})

test("calls onClose when Escape is pressed", () => {
    const onClose = jest.fn()
    render(
        <Modal open={true} onClose={onClose} title="Test">
            <p>Content</p>
        </Modal>
    )

    fireEvent.keyDown(document, { key: "Escape" })

    expect(onClose).toHaveBeenCalledTimes(1)
})
