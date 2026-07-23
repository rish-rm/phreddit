// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { api } from "./api/client.js";

vi.mock("./api/client.js", () => ({
  api: {
    me: vi.fn(),
    getCommunities: vi.fn(),
    logout: vi.fn()
  }
}));

function waitUntilAborted({ signal }) {
  return new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("Aborted")), {
      once: true
    });
  });
}

describe("App bootstrap", () => {
  beforeEach(() => {
    api.me.mockReset();
    api.getCommunities.mockReset();
    api.getCommunities.mockResolvedValue({ communities: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("explains the delay when the session check takes longer than three seconds", async () => {
    vi.useFakeTimers();
    api.me.mockImplementation(waitUntilAborted);

    const view = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Starting Phreddit" })
    ).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(
      screen.getByRole("heading", { name: "Waking the demo server" })
    ).toBeTruthy();
    view.unmount();
  });

  it("recovers from a connection error when retry succeeds", async () => {
    api.me
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce({ user: null });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Retry connection" })
    );

    expect(
      await screen.findByRole("heading", { name: "Welcome to Phreddit" })
    ).toBeTruthy();
    expect(api.me).toHaveBeenCalledTimes(2);
  });
});
