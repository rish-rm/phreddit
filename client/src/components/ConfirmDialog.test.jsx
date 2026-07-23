// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog.jsx";

describe("ConfirmDialog", () => {
  it("focuses the first action, traps Tab, and closes with Escape", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete post?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const confirm = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(document.activeElement).toBe(confirm);

    cancel.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(confirm);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
