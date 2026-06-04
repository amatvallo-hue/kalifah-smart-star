import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

type SessionData = { userId?: string };

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama terlalu pendek").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak sah").max(160),
  password: z.string().min(6, "Kata laluan minimum 6 aksara").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak sah").max(160),
  password: z.string().min(1).max(128),
});

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const { pool } = await import("@/lib/lovable/database");
    const { hashPassword, sessionConfig } = await import("./auth.server");

    const existing = await pool.query("SELECT id FROM public.users WHERE lower(email) = $1", [data.email]);
    if (existing.rowCount && existing.rowCount > 0) {
      throw new Error("Email ini sudah berdaftar. Sila log masuk.");
    }
    const hash = await hashPassword(data.password);
    const result = await pool.query(
      "INSERT INTO public.users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [data.name, data.email, hash],
    );
    const user = result.rows[0];
    const session = await useSession<SessionData>(sessionConfig);
    await session.update({ userId: user.id });
    return { id: user.id, name: user.name, email: user.email };
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { pool } = await import("@/lib/lovable/database");
    const { verifyPassword, sessionConfig } = await import("./auth.server");

    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM public.users WHERE lower(email) = $1",
      [data.email],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Email atau kata laluan salah.");
    const ok = await verifyPassword(data.password, row.password_hash);
    if (!ok) throw new Error("Email atau kata laluan salah.");
    const session = await useSession<SessionData>(sessionConfig);
    await session.update({ userId: row.id });
    return { id: row.id, name: row.name, email: row.email };
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  const { sessionConfig } = await import("./auth.server");
  const session = await useSession<SessionData>(sessionConfig);
  await session.clear();
  return { success: true };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const { pool } = await import("@/lib/lovable/database");
  const { sessionConfig } = await import("./auth.server");
  const session = await useSession<SessionData>(sessionConfig);
  const userId = session.data.userId;
  if (!userId) return null;
  const result = await pool.query("SELECT id, name, email FROM public.users WHERE id = $1", [userId]);
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id as string, name: row.name as string, email: row.email as string };
});
