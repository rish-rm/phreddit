// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SortButtons from "./SortButtons.jsx";

describe("SortButtons", () => {
  it("marks the current sort as active and reports changes", () => {
    const onSortChange = vi.fn();
    render(<SortButtons currentSort="newest" onSortChange={onSortChange} />);

    expect(screen.getByRole("button", { name: "Newest" }).className).toContain("active");
    expect(screen.getByRole("button", { name: "Active" }).className).not.toContain("active");

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(onSortChange).toHaveBeenCalledWith("active");
  });
});
