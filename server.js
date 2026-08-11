// Hostinger Server Entry Point
import("./artifacts/api-server/dist/index.mjs").catch((err) => {
  console.error("Fatal Error starting server from server.js:", err);
  process.exit(1);
});
