import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateInsightsUseCase } from '@application/use-cases/insights/GenerateInsightsUseCase.js';
import { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';
import { Insight } from '@domain/entities/Insight.js';
import { NotFoundError, ForbiddenError } from '@shared/errors/AppError.js';

// ── Factories ──────────────────────────────────────────────────────────────
const makeSession = (overrides: { deleted?: boolean; answers?: Record<string, unknown> } = {}) =>
  new AnamnesisSession(
    's-1', 't-1', 'tpl-1', 'user-1', 'patient-1',
    'completed', null, null, null, new Date(),
    overrides.deleted ? new Date() : null,
    overrides.answers ?? { q1: 'Sim', q2: 7 },
  );

const makeTemplate = (deleted = false) =>
  new AnamnesisTemplate(
    'tpl-1', 't-1', 'Anamnese', 1,
    { questions: [{ id: 'q1', text: 'Q1', type: 'text', required: true }] },
    null, null, new Date(), deleted ? new Date() : null,
  );

const makeInsight = () =>
  new Insight(
    'ins-1', 't-1', 's-1', 'Summary',
    { readiness: 60, dropoutRisk: 30, stress: 40, sleepQuality: 70 },
    ['Rec 1'], 'hash-abc', new Date(),
  );

const makeSessionRepo = () => ({
  findAll: vi.fn(), findById: vi.fn(), findByPublicToken: vi.fn(),
  create: vi.fn(), addAnswers: vi.fn(), addAnswersAndComplete: vi.fn(),
  updateStatus: vi.fn(), updateSignature: vi.fn(), setFillToken: vi.fn(),
});
const makeTemplateRepo = () => ({
  findAll: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
});
const makeInsightRepo = () => ({
  findBySessionId: vi.fn(), create: vi.fn(), findByAnswersHash: vi.fn(),
});
const makeGenerator = () => ({ generate: vi.fn() });
const makeCache = () => ({ get: vi.fn(), set: vi.fn() });
const makeAuditSvc = () => ({ log: vi.fn() });
const makeQuotaSvc = () => ({
  checkPatientQuota: vi.fn(), checkSessionQuota: vi.fn(),
  checkAiInsightQuota: vi.fn(), getUsageSummary: vi.fn(),
});

describe('GenerateInsightsUseCase', () => {
  let sessionRepo: ReturnType<typeof makeSessionRepo>;
  let templateRepo: ReturnType<typeof makeTemplateRepo>;
  let insightRepo: ReturnType<typeof makeInsightRepo>;
  let generator: ReturnType<typeof makeGenerator>;
  let cache: ReturnType<typeof makeCache>;
  let auditSvc: ReturnType<typeof makeAuditSvc>;
  let quotaSvc: ReturnType<typeof makeQuotaSvc>;
  let useCase: GenerateInsightsUseCase;

  beforeEach(() => {
    sessionRepo = makeSessionRepo();
    templateRepo = makeTemplateRepo();
    insightRepo = makeInsightRepo();
    generator = makeGenerator();
    cache = makeCache();
    auditSvc = makeAuditSvc();
    quotaSvc = makeQuotaSvc();

    useCase = new GenerateInsightsUseCase(
      sessionRepo as any, templateRepo as any, insightRepo as any,
      generator as any, cache as any, auditSvc as any, console, quotaSvc as any,
    );

    // Happy-path defaults
    sessionRepo.findById.mockResolvedValue(makeSession());
    templateRepo.findById.mockResolvedValue(makeTemplate());
    insightRepo.findBySessionId.mockResolvedValue(null);
    insightRepo.findByAnswersHash.mockResolvedValue(null);
    insightRepo.create.mockResolvedValue(makeInsight());
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue(undefined);
    auditSvc.log.mockResolvedValue(undefined);
    quotaSvc.checkAiInsightQuota.mockResolvedValue({ allowed: true, current: 0, max: null });
    generator.generate.mockResolvedValue({
      summary: 'Generated summary',
      risks: { readiness: 60, dropoutRisk: 30, stress: 40, sleepQuality: 70 },
      recommendations: ['Rec 1'],
    });
  });

  it('returns existing insight without generating a new one', async () => {
    const existing = makeInsight();
    insightRepo.findBySessionId.mockResolvedValue(existing);

    const result = await useCase.execute({ sessionId: 's-1', tenantId: 't-1' });

    expect(result).toBe(existing);
    expect(generator.generate).not.toHaveBeenCalled();
    expect(insightRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when session does not exist', async () => {
    sessionRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ sessionId: 'missing', tenantId: 't-1' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when session is deleted', async () => {
    sessionRepo.findById.mockResolvedValue(makeSession({ deleted: true }));
    await expect(
      useCase.execute({ sessionId: 's-1', tenantId: 't-1' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when template does not exist', async () => {
    templateRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ sessionId: 's-1', tenantId: 't-1' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when template is deleted', async () => {
    templateRepo.findById.mockResolvedValue(makeTemplate(true));
    await expect(
      useCase.execute({ sessionId: 's-1', tenantId: 't-1' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('calls generator.generate and persists the result', async () => {
    await useCase.execute({ sessionId: 's-1', tenantId: 't-1' });
    expect(generator.generate).toHaveBeenCalledTimes(1);
    expect(insightRepo.create).toHaveBeenCalledTimes(1);
  });

  it('calls auditService.log after generating', async () => {
    await useCase.execute({ sessionId: 's-1', tenantId: 't-1' });
    expect(auditSvc.log).toHaveBeenCalledWith(
      't-1', 'generate_insight', 'insight',
      expect.any(String), 'system',
      expect.objectContaining({ sessionId: 's-1' }),
    );
  });

  it('uses actorUserId in audit log when provided', async () => {
    await useCase.execute({ sessionId: 's-1', tenantId: 't-1', actorUserId: 'actor-99' });
    expect(auditSvc.log).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), expect.any(String),
      expect.any(String), 'actor-99', expect.any(Object),
    );
  });

  it('throws ForbiddenError when quota check fails', async () => {
    quotaSvc.checkAiInsightQuota.mockResolvedValue({
      allowed: false, current: 0, max: 0, message: 'Plan does not allow AI',
    });
    await expect(
      useCase.execute({ sessionId: 's-1', tenantId: 't-1' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('skips quota check when quotaService is not provided', async () => {
    const noquota = new GenerateInsightsUseCase(
      sessionRepo as any, templateRepo as any, insightRepo as any,
      generator as any, null, auditSvc as any,
    );
    const result = await noquota.execute({ sessionId: 's-1', tenantId: 't-1' });
    expect(result).toBeDefined();
    expect(quotaSvc.checkAiInsightQuota).not.toHaveBeenCalled();
  });

  describe('cache behaviour (useCache: true)', () => {
    it('does not check cache when useCache is false or omitted', async () => {
      await useCase.execute({ sessionId: 's-1', tenantId: 't-1', useCache: false });
      expect(cache.get).not.toHaveBeenCalled();
    });

    it('checks cache when useCache is true', async () => {
      await useCase.execute({ sessionId: 's-1', tenantId: 't-1', useCache: true });
      expect(cache.get).toHaveBeenCalled();
    });

    it('stores result in cache when useCache is true and no cache hit', async () => {
      await useCase.execute({ sessionId: 's-1', tenantId: 't-1', useCache: true });
      expect(cache.set).toHaveBeenCalled();
    });

    it('creates insight from cache hit for a different session', async () => {
      cache.get.mockResolvedValue({
        sessionId: 'other-session',
        summary: 'Cached summary',
        risksJson: { readiness: 70, dropoutRisk: 20, stress: 30, sleepQuality: 80 },
        recommendationsJson: ['From cache'],
      });

      await useCase.execute({ sessionId: 's-1', tenantId: 't-1', useCache: true });

      expect(generator.generate).not.toHaveBeenCalled();
      expect(insightRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'Cached summary' })
      );
    });
  });
});
