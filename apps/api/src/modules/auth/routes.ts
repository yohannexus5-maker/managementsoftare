import { Router } from "express";
import { loginSchema } from "@apms/shared";
import { prisma } from "../../lib/prisma";
import { verifyPassword } from "../../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { unauthorized } from "../../middleware/errors";
import { recordAudit } from "../../lib/audit";

const router = Router();

const REFRESH_COOKIE = "apms_refresh";
const isProd = process.env.NODE_ENV === "production";

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    // Frontend (Netlify) and API (Render) are on different origins in
    // production, so the refresh cookie must be sameSite=none + secure —
    // browsers silently drop cross-site cookies otherwise. "lax" is fine
    // for local dev where both run on localhost.
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  officeId: string;
  active: boolean;
  consultantId: string | null;
  clientId: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    officeId: user.officeId,
    active: user.active,
    consultantId: user.consultantId,
    clientId: user.clientId,
  };
}

router.post(
  "/login",
  asyncHandler(async (req, res, next) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active) return next(unauthorized("Invalid email or password"));

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) return next(unauthorized("Invalid email or password"));

    const accessToken = signAccessToken({ sub: user.id, role: user.role, officeId: user.officeId });
    const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
    setRefreshCookie(res, refreshToken);

    await recordAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });

    res.json({ accessToken, user: toPublicUser(user) });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res, next) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return next(unauthorized("Missing refresh token"));

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return next(unauthorized("Invalid refresh token"));
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active || user.tokenVersion !== payload.tokenVersion) {
      return next(unauthorized("Refresh token no longer valid"));
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, officeId: user.officeId });
    res.json({ accessToken, user: toPublicUser(user) });
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).end();
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) return next(unauthorized());
    res.json({ user: toPublicUser(user) });
  })
);

export default router;
