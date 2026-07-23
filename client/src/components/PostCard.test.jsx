// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PostCard from "./PostCard.jsx";

const post = {
  _id: "post-1",
  title: "A carefully tested post",
  content: "1234567890".repeat(10),
  community: { _id: "community-1", name: "testing" },
  postedBy: { _id: "user-1", displayName: "author" },
  createdAt: new Date().toISOString(),
  views: 3,
  commentCount: 2,
  upvotes: 1,
  downvotes: 0
};

afterEach(cleanup);

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <PostCard
        post={post}
        user={null}
        showMessage={vi.fn()}
        onUserRefresh={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
}

describe("PostCard", () => {
  it("renders only the first 80 content characters in listings", () => {
    renderCard();
    expect(screen.getByText("1234567890".repeat(8))).toBeTruthy();
    expect(screen.queryByText("1234567890".repeat(10))).toBeNull();
  });

  it("can omit the community link for a community-specific listing", () => {
    renderCard({ showCommunity: false });
    expect(screen.queryByRole("link", { name: "testing" })).toBeNull();
    expect(screen.getByRole("link", { name: post.title })).toBeTruthy();
  });
});
