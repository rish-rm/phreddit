const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000/api`).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.errors?.join(" ") || "Request failed.");
  }

  return data;
}

export const api = {
  me: () => request("/auth/me"),
  register: (body) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  login: (body) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  logout: () =>
    request("/auth/logout", {
      method: "POST"
    }),
  getCommunities: () => request("/communities"),
  getCommunity: (id) => request(`/communities/${id}`),
  createCommunity: (body) =>
    request("/communities", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  joinCommunity: (id) =>
    request(`/communities/${id}/join`, {
      method: "POST"
    }),
  leaveCommunity: (id) =>
    request(`/communities/${id}/leave`, {
      method: "POST"
    }),
  getPosts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.community) query.set("community", params.community);
    if (params.search) query.set("search", params.search);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/posts${suffix}`);
  },
  getLinkFlairs: () => request("/linkflairs"),
  createLinkFlair: (body) =>
    request("/linkflairs", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getPost: (id, options = {}) => {
    const query = new URLSearchParams();
    if (options.incrementView === false) query.set("incrementView", "false");
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/posts/${id}${suffix}`);
  },
  createPost: (body) =>
    request("/posts", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  votePost: (id, voteType) =>
    request(`/posts/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType })
    }),
  createComment: (body) =>
    request("/comments", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  voteComment: (id, voteType) =>
    request(`/comments/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType })
    }),
  getProfileContent: (id) => request(`/users/${id}/profile-content`),
  listUsers: () => request("/users"),
  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: "DELETE"
    })
};
