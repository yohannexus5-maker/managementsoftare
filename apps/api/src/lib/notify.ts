import { prisma } from "./prisma";
import { sendEmail } from "./email";
import type { NotificationType } from "@apms/shared";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Creates an in-app notification and best-effort emails it via the dev-mode
 * email stub. Swapping `sendEmail` for a real provider (SES/SendGrid) later
 * does not require touching call sites.
 */
export async function notify({ userId, type, title, body, link }: NotifyParams) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await sendEmail({ to: user.email, subject: title, text: body ?? title });
  }

  return notification;
}

export async function notifyMany(userIds: string[], params: Omit<NotifyParams, "userId">) {
  await Promise.all(userIds.map((userId) => notify({ userId, ...params })));
}
