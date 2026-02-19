import type { PrismaClient } from '@prisma/client';

/**
 * Check if tenant has exceeded cost threshold and send alert if needed.
 * Returns true if alert was sent, false otherwise.
 */
export async function checkAndSendCostAlert(
  prisma: PrismaClient,
  tenantId: string
): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      aiCostLimitUsd: true,
      aiCostAlertThreshold: true,
      aiCostAlertSentAt: true,
    },
  });

  if (!tenant || !tenant.aiCostLimitUsd || !tenant.aiCostAlertThreshold) {
    return false; // No limits configured
  }

  // Calculate current period cost (last 30 days)
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);

  const metrics = await prisma.aiUsageMetric.findMany({
    where: {
      tenantId,
      createdAt: { gte: periodStart },
    },
  });

  const currentCost = metrics.reduce((sum, m) => sum + m.estimatedCostUsd, 0);
  const thresholdCost = tenant.aiCostLimitUsd * (tenant.aiCostAlertThreshold / 100);

  if (currentCost < thresholdCost) {
    return false; // Below threshold
  }

  // Check if alert was already sent recently (within last 24 hours)
  const lastAlertSent = tenant.aiCostAlertSentAt;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (lastAlertSent && lastAlertSent > oneDayAgo) {
    return false; // Alert already sent recently
  }

  // Send alert
  await prisma.$transaction([
    prisma.aiCostAlert.create({
      data: {
        tenantId,
        currentCostUsd: currentCost,
        limitUsd: tenant.aiCostLimitUsd,
        thresholdPercent: tenant.aiCostAlertThreshold,
      },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: { aiCostAlertSentAt: new Date() },
    }),
  ]);

  return true;
}

/**
 * Get cost alert status for tenant.
 */
export async function getCostAlertStatus(
  prisma: PrismaClient,
  tenantId: string
): Promise<{
  limitUsd: number | null;
  thresholdPercent: number | null;
  currentCostUsd: number;
  thresholdCostUsd: number | null;
  alertSentAt: Date | null;
  status: 'ok' | 'warning' | 'limit';
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      aiCostLimitUsd: true,
      aiCostAlertThreshold: true,
      aiCostAlertSentAt: true,
    },
  });

  if (!tenant || !tenant.aiCostLimitUsd || !tenant.aiCostAlertThreshold) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 30);
    const metrics = await prisma.aiUsageMetric.findMany({
      where: { tenantId, createdAt: { gte: periodStart } },
    });
    const currentCost = metrics.reduce((sum, m) => sum + m.estimatedCostUsd, 0);

    return {
      limitUsd: null,
      thresholdPercent: null,
      currentCostUsd: currentCost,
      thresholdCostUsd: null,
      alertSentAt: null,
      status: 'ok',
    };
  }

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);
  const metrics = await prisma.aiUsageMetric.findMany({
    where: { tenantId, createdAt: { gte: periodStart } },
  });
  const currentCost = metrics.reduce((sum, m) => sum + m.estimatedCostUsd, 0);
  const thresholdCost = tenant.aiCostLimitUsd * (tenant.aiCostAlertThreshold / 100);

  let status: 'ok' | 'warning' | 'limit' = 'ok';
  if (currentCost >= tenant.aiCostLimitUsd) {
    status = 'limit';
  } else if (currentCost >= thresholdCost) {
    status = 'warning';
  }

  return {
    limitUsd: tenant.aiCostLimitUsd,
    thresholdPercent: tenant.aiCostAlertThreshold,
    currentCostUsd: currentCost,
    thresholdCostUsd: thresholdCost,
    alertSentAt: tenant.aiCostAlertSentAt,
    status,
  };
}
