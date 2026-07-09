// Thin wrapper so route handlers can emit realtime events without holding a
// reference to the Socket.IO server. When no io instance is registered
// (unit/integration tests, scripts), emits are no-ops.
let io = null;

export function setIo(instance) {
  io = instance;
}

export function emitPostUpdated(postId) {
  if (!io || !postId) return;
  io.to(`post:${String(postId)}`).emit("post:updated", {
    postId: String(postId)
  });
}
