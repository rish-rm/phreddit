// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import CreateCommunity from "./CreateCommunity.jsx";

const navigate = vi.fn();
const showMessage = vi.fn();
const refreshCurrentUser = vi.fn();

vi.mock("../api/client.js", () => ({
  api: {
    createCommunity: vi.fn()
  }
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useOutletContext: () => ({
    user: { _id: "user-1", displayName: "creator" },
    showMessage,
    refreshCurrentUser
  })
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("CreateCommunity", () => {
  it("refreshes membership state before navigating to the new community", async () => {
    let finishRefresh;
    refreshCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        finishRefresh = resolve;
      })
    );
    api.createCommunity.mockResolvedValue({
      community: { _id: "community-1" }
    });

    render(<CreateCommunity />);
    fireEvent.change(screen.getByLabelText("Community name*"), {
      target: { value: "fullstack" }
    });
    fireEvent.change(screen.getByLabelText("Description*"), {
      target: { value: "Production web engineering" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalledOnce());
    expect(navigate).not.toHaveBeenCalled();

    await act(async () => finishRefresh());

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/communities/community-1");
    });
    expect(showMessage).toHaveBeenCalledWith(
      "Community created successfully.",
      "success"
    );
  });
});
