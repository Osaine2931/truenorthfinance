import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  const method = event.node.req.method?.toUpperCase();
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = await readBody(event);
  const action = event.path.split("/").filter(Boolean).pop();

  if (action === "sign-in") {
    return { ok: true, message: "Sign-in endpoint ready", body };
  }

  if (action === "sign-up") {
    return { ok: true, message: "Sign-up endpoint ready", body };
  }

  if (action === "sign-out") {
    return { ok: true, message: "Sign-out endpoint ready" };
  }

  if (action === "request-password-reset") {
    return { ok: true, message: "Password reset endpoint ready", body };
  }

  if (action === "update-password") {
    return { ok: true, message: "Password update endpoint ready", body };
  }

  throw createError({ statusCode: 404, statusMessage: "Not found" });
});
