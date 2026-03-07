import type { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { env } from '@config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = env.SMTP_HOST ?? process.env.SMTP_HOST;
  const port = env.SMTP_PORT ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined);
  const user = env.SMTP_USER ?? process.env.SMTP_USER;
  const pass = env.SMTP_PASS ?? process.env.SMTP_PASS;
  const secure = env.SMTP_SECURE ?? (process.env.SMTP_SECURE === 'true');
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: port ?? 587,
    secure: !!secure,
    auth: { user, pass },
  });
  return transporter;
}

const fromAddress = (): string => {
  const f = env.SMTP_FROM ?? process.env.SMTP_FROM;
  return f && f.length > 0 ? f : 'noreply@anamnese.local';
};

export interface AlertRow {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  severity: string;
  type: string;
}

/**
 * Send daily alerts summary to practitioners/admins of tenants that have emailAlertsEnabled.
 * Call after runAlertEngine. Uses SMTP from env (optional).
 */
export async function sendDailyAlertsEmails(
  prisma: PrismaClient,
  baseUrl: string
): Promise<{ sent: number }> {
  const trans = getTransporter();
  if (!trans) return { sent: 0 };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, status: 'active', emailAlertsEnabled: true },
    select: { id: true, name: true },
  });

  let sent = 0;

  for (const tenant of tenants) {
    const unreadAlerts = await prisma.alert.findMany({
      where: { tenantId: tenant.id, readAt: null, createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { patient: { select: { id: true, fullName: true } } },
    });
    if (unreadAlerts.length === 0) continue;

    const members = await prisma.membership.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
        role: { in: ['owner', 'admin', 'practitioner'] },
      },
      include: { user: { select: { email: true } } },
    });
    const emails = members.map((m) => m.user.email).filter((e): e is string => !!e);
    if (emails.length === 0) continue;

    const hubLinks = unreadAlerts.map(
      (a) =>
        `<li style="margin: 8px 0;"><strong>${escapeHtml(a.patient.fullName)}</strong>: ${escapeHtml(a.message)} &ndash; <a href="${baseUrl}/patients/${a.patientId}/hub">Ver hub</a></li>`
    );

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Resumo de alertas</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Resumo diário de alertas</h2>
  <p>Olá,</p>
  <p>Você tem <strong>${unreadAlerts.length}</strong> alerta(s) não lido(s) no tenant <strong>${escapeHtml(tenant.name)}</strong>:</p>
  <ul style="list-style: none; padding-left: 0;">
    ${hubLinks.join('')}
  </ul>
  <p><a href="${baseUrl}" style="display: inline-block; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Abrir plataforma</a></p>
  <p style="color: #666; font-size: 12px;">Este é um email automático. Para desativar, desmarque "Alertas por email" nas configurações do tenant.</p>
</body>
</html>`;

    try {
      await trans.sendMail({
        from: fromAddress(),
        to: emails,
        subject: `[${tenant.name}] Resumo de alertas (${unreadAlerts.length})`,
        html,
      });
      sent++;
    } catch (err) {
      // Log but don't throw so other tenants still get emails
      if (typeof process !== 'undefined' && process.emit) {
        process.emit('warning', err as Error);
      }
    }
  }

  return { sent };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
