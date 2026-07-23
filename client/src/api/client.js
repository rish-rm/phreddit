const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

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
  me: (options = {}) => request("/auth/me", options),
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
  updateCommunity: (id, body) =>
    request(`/communities/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteCommunity: (id) =>
    request(`/communities/${id}`, {
      method: "DELETE"
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
    if (params.linkFlair) query.set("linkFlair", params.linkFlair);
    if (params.search) query.set("search", params.search);
    if (params.sort) query.set("sort", params.sort);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/posts${suffix}`);
  },
  getLinkFlairs: () => request("/linkflairs"),
  createLinkFlair: (body) =>
    request("/linkflairs", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getPost: (id) => request(`/posts/${id}`),
  viewPost: (id) =>
    request(`/posts/${id}/view`, {
      method: "POST"
    }),
  createPost: (body) =>
    request("/posts", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updatePost: (id, body) =>
    request(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deletePost: (id) =>
    request(`/posts/${id}`, {
      method: "DELETE"
    }),
  votePost: (id, voteType) =>
    request(`/posts/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType })
    }),
  savePost: (id) =>
    request(`/users/me/saved-posts/${id}`, {
      method: "POST"
    }),
  unsavePost: (id) =>
    request(`/users/me/saved-posts/${id}`, {
      method: "DELETE"
    }),
  createComment: (body) =>
    request("/comments", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateComment: (id, body) =>
    request(`/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteComment: (id) =>
    request(`/comments/${id}`, {
      method: "DELETE"
    }),
  voteComment: (id, voteType) =>
    request(`/comments/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType })
    }),
  reportPost: (id, body) =>
    request(`/reports/posts/${id}`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  listReports: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/reports${suffix}`);
  },
  resolveReport: (id, body) =>
    request(`/reports/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getProfileContent: (id) => request(`/users/${id}/profile-content`),
  getPublicProfile: (id) => request(`/users/${id}/public`),
  listUsers: () => request("/users"),
  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: "DELETE"
    })
};
