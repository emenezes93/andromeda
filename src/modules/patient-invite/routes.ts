import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { NotFoundError, ForbiddenError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';
import { Guards } from '@shared/utils/rbac.js';

export async function patientInviteRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /v1/patients/:id/invite — Generate invite link for patient to register on mobile app
  fastify.post(
    '/v1/patients/:id/invite',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            sendEmail: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              inviteLink: { type: 'string' },
              whatsappLink: { type: 'string' },
              emailSent: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role); // practitioner+

      const { id } = request.params as { id: string };
      const body = (request.body as { sendEmail?: boolean }) ?? {};

      const patient = await fastify.prisma.patient.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');
      if (!patient.email)
        throw new ForbiddenError(
          'Paciente não possui email cadastrado. Adicione um email antes de enviar o convite.'
        );

      const tenant = await fastify.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      // Build invite universal link (abre app quando universal/app links estiverem configurados)
      const inviteLink = `https://app.fitinsight.com/register?tenantId=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(patient.email)}&tenantName=${encodeURIComponent(tenant?.name ?? '')}`;

      // WhatsApp message
      const whatsappMessage = `Olá ${patient.fullName}! 👋\n\nSeu profissional da *${tenant?.name ?? 'clínica'}* convidou você para usar o app Fit Insight.\n\nBaixe o app e use este link para se registrar:\n${inviteLink}\n\nOu registre manualmente com:\n- Código da organização: ${tenantId}\n- Email: ${patient.email}`;
      const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

      // Optionally send email via nodemailer (reuse alerts email infra)
      let emailSent = false;
      if (body.sendEmail) {
        try {
          const nodemailer = await import('nodemailer');
          const { env } = await import('@config/env.js');
          const host = env.SMTP_HOST ?? process.env.SMTP_HOST;
          const smtpUser = env.SMTP_USER ?? process.env.SMTP_USER;
          const pass = env.SMTP_PASS ?? process.env.SMTP_PASS;
          if (host && smtpUser && pass) {
            const port =
              env.SMTP_PORT ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
            const secure = env.SMTP_SECURE ?? (process.env.SMTP_SECURE === 'true');
            const transporter = nodemailer.default.createTransport({
              host,
              port,
              secure: !!secure,
              auth: { user: smtpUser, pass },
            });
            const fromAddress =
              env.SMTP_FROM ?? process.env.SMTP_FROM ?? 'noreply@fitinsight.app';
            await transporter.sendMail({
              from: fromAddress,
              to: patient.email,
              subject: `${tenant?.name ?? 'Sua clínica'} convidou você para o Fit Insight`,
              html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
  <h2>Olá, ${patient.fullName}!</h2>
  <p>Seu profissional da <strong>${tenant?.name ?? 'clínica'}</strong> convidou você para acompanhar seus treinos, dieta e evolução pelo app <strong>Fit Insight</strong>.</p>
  <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Abrir no app</a></p>
  <p style="color: #666; font-size: 13px;">Ou registre manualmente no app com:<br>Código: <strong>${tenantId}</strong><br>Email: <strong>${patient.email}</strong></p>
</body></html>`,
            });
            emailSent = true;
          }
        } catch {
          // Email sending failed silently - link still works
        }
      }

      await auditLog(fastify.prisma, tenantId, 'invite_sent', 'patient', id, user.userId, {
        email: patient.email,
        emailSent,
      });

      return reply.status(200).send({ inviteLink, whatsappLink, emailSent });
    }
  );
}
