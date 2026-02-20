import type { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';
import { PrismaMembershipRepository } from '../repositories/PrismaMembershipRepository.js';
import { PrismaTenantRepository } from '../repositories/PrismaTenantRepository.js';
import { PrismaRefreshTokenRepository } from '../repositories/PrismaRefreshTokenRepository.js';
import { PrismaUserExportRepository } from '../repositories/PrismaUserExportRepository.js';
import { PrismaPatientRepository } from '../repositories/PrismaPatientRepository.js';
import { PrismaTemplateRepository } from '../repositories/PrismaTemplateRepository.js';
import { PrismaSessionRepository } from '../repositories/PrismaSessionRepository.js';
import { PrismaInsightRepository } from '../repositories/PrismaInsightRepository.js';
import { PrismaAuditQueryRepository } from '../repositories/PrismaAuditQueryRepository.js';
import { PrismaStatsRepository } from '../repositories/PrismaStatsRepository.js';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository.js';
import { BcryptPasswordService } from '../services/BcryptPasswordService.js';
import { RuleBasedInsightGenerator } from '../services/RuleBasedInsightGenerator.js';
import { LLMMockInsightGenerator } from '../services/LLMMockInsightGenerator.js';
import { NoopInsightCache } from '../services/NoopInsightCache.js';
import { createRedisInsightCache } from '../services/RedisInsightCache.js';
import type { IInsightCache } from '@ports/services/IInsightCache.js';
import { ConditionalQuestionEngine } from '../services/ConditionalQuestionEngine.js';
import { JwtTokenService } from '../services/JwtTokenService.js';
import { PrismaAuditService } from '../services/PrismaAuditService.js';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase.js';
import { RegisterUseCase } from '@application/use-cases/auth/RegisterUseCase.js';
import { ExportUserDataUseCase } from '@application/use-cases/users/ExportUserDataUseCase.js';
import { ListUsersUseCase } from '@application/use-cases/users/ListUsersUseCase.js';
import { GetUserUseCase } from '@application/use-cases/users/GetUserUseCase.js';
import { CreateUserUseCase } from '@application/use-cases/users/CreateUserUseCase.js';
import { DeleteUserUseCase } from '@application/use-cases/users/DeleteUserUseCase.js';
import { UpdateRoleUseCase } from '@application/use-cases/users/UpdateRoleUseCase.js';
import { SetActiveUseCase } from '@application/use-cases/users/SetActiveUseCase.js';
import { AuthController } from '@presentation/controllers/AuthController.js';
import { UserController } from '@presentation/controllers/UserController.js';
import { TenantController } from '@presentation/controllers/TenantController.js';
import { ListTenantsUseCase } from '@application/use-cases/tenants/ListTenantsUseCase.js';
import { GetTenantUseCase } from '@application/use-cases/tenants/GetTenantUseCase.js';
import { CreateTenantUseCase } from '@application/use-cases/tenants/CreateTenantUseCase.js';
import { UpdateTenantUseCase } from '@application/use-cases/tenants/UpdateTenantUseCase.js';
import { SuspendTenantUseCase } from '@application/use-cases/tenants/SuspendTenantUseCase.js';
import { ActivateTenantUseCase } from '@application/use-cases/tenants/ActivateTenantUseCase.js';
import { ListPatientsUseCase } from '@application/use-cases/patients/ListPatientsUseCase.js';
import { GetPatientUseCase } from '@application/use-cases/patients/GetPatientUseCase.js';
import { CreatePatientUseCase } from '@application/use-cases/patients/CreatePatientUseCase.js';
import { UpdatePatientUseCase } from '@application/use-cases/patients/UpdatePatientUseCase.js';
import { DeletePatientUseCase } from '@application/use-cases/patients/DeletePatientUseCase.js';
import { PatientController } from '@presentation/controllers/PatientController.js';
import { ListTemplatesUseCase } from '@application/use-cases/anamnesis/templates/ListTemplatesUseCase.js';
import { GetTemplateUseCase } from '@application/use-cases/anamnesis/templates/GetTemplateUseCase.js';
import { CreateTemplateUseCase } from '@application/use-cases/anamnesis/templates/CreateTemplateUseCase.js';
import { UpdateTemplateUseCase } from '@application/use-cases/anamnesis/templates/UpdateTemplateUseCase.js';
import { DeleteTemplateUseCase } from '@application/use-cases/anamnesis/templates/DeleteTemplateUseCase.js';
import { TemplateController } from '@presentation/controllers/TemplateController.js';
import { ListSessionsUseCase } from '@application/use-cases/anamnesis/sessions/ListSessionsUseCase.js';
import { GetSessionUseCase } from '@application/use-cases/anamnesis/sessions/GetSessionUseCase.js';
import { CreateSessionUseCase } from '@application/use-cases/anamnesis/sessions/CreateSessionUseCase.js';
import { AnswerQuestionUseCase } from '@application/use-cases/anamnesis/sessions/AnswerQuestionUseCase.js';
import { SignSessionUseCase } from '@application/use-cases/anamnesis/sessions/SignSessionUseCase.js';
import { GenerateFillLinkUseCase } from '@application/use-cases/anamnesis/sessions/GenerateFillLinkUseCase.js';
import { GetNextQuestionUseCase } from '@application/use-cases/anamnesis/sessions/GetNextQuestionUseCase.js';
import { PublicGetSessionByTokenUseCase } from '@application/use-cases/anamnesis/sessions/PublicGetSessionByTokenUseCase.js';
import { PublicGetNextQuestionUseCase } from '@application/use-cases/anamnesis/sessions/PublicGetNextQuestionUseCase.js';
import { PublicSubmitAnswerUseCase } from '@application/use-cases/anamnesis/sessions/PublicSubmitAnswerUseCase.js';
import { PublicSignSessionUseCase } from '@application/use-cases/anamnesis/sessions/PublicSignSessionUseCase.js';
import { SessionController } from '@presentation/controllers/SessionController.js';
import { GenerateInsightsUseCase } from '@application/use-cases/insights/GenerateInsightsUseCase.js';
import { GetInsightBySessionUseCase } from '@application/use-cases/insights/GetInsightBySessionUseCase.js';
import { InsightController } from '@presentation/controllers/InsightController.js';
import { ListAuditLogsUseCase } from '@application/use-cases/audit/ListAuditLogsUseCase.js';
import { AuditController } from '@presentation/controllers/AuditController.js';
import { GetDashboardStatsUseCase } from '@application/use-cases/stats/GetDashboardStatsUseCase.js';
import { GetTemplateReportUseCase } from '@application/use-cases/stats/GetTemplateReportUseCase.js';
import { StatsController } from '@presentation/controllers/StatsController.js';
import { ListGoalsUseCase } from '@application/use-cases/goals/ListGoalsUseCase.js';
import { GetGoalUseCase } from '@application/use-cases/goals/GetGoalUseCase.js';
import { CreateGoalUseCase } from '@application/use-cases/goals/CreateGoalUseCase.js';
import { UpdateGoalUseCase } from '@application/use-cases/goals/UpdateGoalUseCase.js';
import { DeleteGoalUseCase } from '@application/use-cases/goals/DeleteGoalUseCase.js';
import { GoalController } from '@presentation/controllers/GoalController.js';
import { env } from '@config/env.js';

/**
 * Dependency Injection Container
 * Composes all dependencies following hexagonal architecture
 */
export class Container {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger?: { warn(msg: string, data?: unknown): void }
  ) {}

  // Repositories
  private _userRepository?: PrismaUserRepository;
  get userRepository(): PrismaUserRepository {
    if (!this._userRepository) {
      this._userRepository = new PrismaUserRepository(this.prisma);
    }
    return this._userRepository;
  }

  private _membershipRepository?: PrismaMembershipRepository;
  get membershipRepository(): PrismaMembershipRepository {
    if (!this._membershipRepository) {
      this._membershipRepository = new PrismaMembershipRepository(this.prisma);
    }
    return this._membershipRepository;
  }

  private _tenantRepository?: PrismaTenantRepository;
  get tenantRepository(): PrismaTenantRepository {
    if (!this._tenantRepository) {
      this._tenantRepository = new PrismaTenantRepository(this.prisma);
    }
    return this._tenantRepository;
  }

  private _refreshTokenRepository?: PrismaRefreshTokenRepository;
  get refreshTokenRepository(): PrismaRefreshTokenRepository {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = new PrismaRefreshTokenRepository(this.prisma);
    }
    return this._refreshTokenRepository;
  }

  private _userExportRepository?: PrismaUserExportRepository;
  get userExportRepository(): PrismaUserExportRepository {
    if (!this._userExportRepository) {
      this._userExportRepository = new PrismaUserExportRepository(this.prisma);
    }
    return this._userExportRepository;
  }

  private _patientRepository?: PrismaPatientRepository;
  get patientRepository(): PrismaPatientRepository {
    if (!this._patientRepository) {
      this._patientRepository = new PrismaPatientRepository(this.prisma);
    }
    return this._patientRepository;
  }

  private _templateRepository?: PrismaTemplateRepository;
  get templateRepository(): PrismaTemplateRepository {
    if (!this._templateRepository) {
      this._templateRepository = new PrismaTemplateRepository(this.prisma);
    }
    return this._templateRepository;
  }

  private _sessionRepository?: PrismaSessionRepository;
  get sessionRepository(): PrismaSessionRepository {
    if (!this._sessionRepository) {
      this._sessionRepository = new PrismaSessionRepository(this.prisma);
    }
    return this._sessionRepository;
  }

  private _insightRepository?: PrismaInsightRepository;
  get insightRepository(): PrismaInsightRepository {
    if (!this._insightRepository) {
      this._insightRepository = new PrismaInsightRepository(this.prisma);
    }
    return this._insightRepository;
  }

  private _auditQueryRepository?: PrismaAuditQueryRepository;
  get auditQueryRepository(): PrismaAuditQueryRepository {
    if (!this._auditQueryRepository) {
      this._auditQueryRepository = new PrismaAuditQueryRepository(this.prisma);
    }
    return this._auditQueryRepository;
  }

  private _statsRepository?: PrismaStatsRepository;
  get statsRepository(): PrismaStatsRepository {
    if (!this._statsRepository) {
      this._statsRepository = new PrismaStatsRepository(this.prisma);
    }
    return this._statsRepository;
  }

  private _goalRepository?: PrismaGoalRepository;
  get goalRepository(): PrismaGoalRepository {
    if (!this._goalRepository) {
      this._goalRepository = new PrismaGoalRepository(this.prisma);
    }
    return this._goalRepository;
  }

  // Services
  private _insightCache?: IInsightCache;
  get insightCache(): IInsightCache {
    if (!this._insightCache) {
      this._insightCache = env.REDIS_URL
        ? createRedisInsightCache(env.REDIS_URL)
        : new NoopInsightCache();
    }
    return this._insightCache;
  }

  private _insightGenerator?: RuleBasedInsightGenerator | LLMMockInsightGenerator;
  get insightGenerator(): RuleBasedInsightGenerator | LLMMockInsightGenerator {
    if (!this._insightGenerator) {
      this._insightGenerator =
        env.AI_MODE === 'llmMock'
          ? new LLMMockInsightGenerator()
          : new RuleBasedInsightGenerator();
    }
    return this._insightGenerator;
  }

  private _passwordService?: BcryptPasswordService;
  get passwordService(): BcryptPasswordService {
    if (!this._passwordService) {
      this._passwordService = new BcryptPasswordService();
    }
    return this._passwordService;
  }

  private _questionEngine?: ConditionalQuestionEngine;
  get questionEngine(): ConditionalQuestionEngine {
    if (!this._questionEngine) {
      this._questionEngine = new ConditionalQuestionEngine();
    }
    return this._questionEngine;
  }

  private _tokenService?: JwtTokenService;
  get tokenService(): JwtTokenService {
    if (!this._tokenService) {
      this._tokenService = new JwtTokenService(env.JWT_SECRET);
    }
    return this._tokenService;
  }

  private _auditService?: PrismaAuditService;
  get auditService(): PrismaAuditService {
    if (!this._auditService) {
      this._auditService = new PrismaAuditService(this.prisma);
    }
    return this._auditService;
  }

  // Use Cases
  private _loginUseCase?: LoginUseCase;
  get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(
        this.userRepository,
        this.membershipRepository,
        this.tenantRepository,
        this.refreshTokenRepository,
        this.passwordService,
        this.tokenService,
        this.auditService
      );
    }
    return this._loginUseCase;
  }

  private _refreshTokenUseCase?: RefreshTokenUseCase;
  get refreshTokenUseCase(): RefreshTokenUseCase {
    if (!this._refreshTokenUseCase) {
      this._refreshTokenUseCase = new RefreshTokenUseCase(
        this.refreshTokenRepository,
        this.userRepository,
        this.membershipRepository,
        this.tenantRepository,
        this.tokenService
      );
    }
    return this._refreshTokenUseCase;
  }

  private _logoutUseCase?: LogoutUseCase;
  get logoutUseCase(): LogoutUseCase {
    if (!this._logoutUseCase) {
      this._logoutUseCase = new LogoutUseCase(this.refreshTokenRepository);
    }
    return this._logoutUseCase;
  }

  private _registerUseCase?: RegisterUseCase;
  get registerUseCase(): RegisterUseCase {
    if (!this._registerUseCase) {
      this._registerUseCase = new RegisterUseCase(
        this.userRepository,
        this.passwordService
      );
    }
    return this._registerUseCase;
  }

  private _exportUserDataUseCase?: ExportUserDataUseCase;
  get exportUserDataUseCase(): ExportUserDataUseCase {
    if (!this._exportUserDataUseCase) {
      this._exportUserDataUseCase = new ExportUserDataUseCase(this.userExportRepository);
    }
    return this._exportUserDataUseCase;
  }

  private _listUsersUseCase?: ListUsersUseCase;
  get listUsersUseCase(): ListUsersUseCase {
    if (!this._listUsersUseCase) {
      this._listUsersUseCase = new ListUsersUseCase(this.membershipRepository);
    }
    return this._listUsersUseCase;
  }

  private _getUserUseCase?: GetUserUseCase;
  get getUserUseCase(): GetUserUseCase {
    if (!this._getUserUseCase) {
      this._getUserUseCase = new GetUserUseCase(this.userRepository, this.membershipRepository);
    }
    return this._getUserUseCase;
  }

  private _createUserUseCase?: CreateUserUseCase;
  get createUserUseCase(): CreateUserUseCase {
    if (!this._createUserUseCase) {
      this._createUserUseCase = new CreateUserUseCase(
        this.userRepository,
        this.membershipRepository,
        this.passwordService,
        this.auditService
      );
    }
    return this._createUserUseCase;
  }

  private _deleteUserUseCase?: DeleteUserUseCase;
  get deleteUserUseCase(): DeleteUserUseCase {
    if (!this._deleteUserUseCase) {
      this._deleteUserUseCase = new DeleteUserUseCase(
        this.membershipRepository,
        this.auditService
      );
    }
    return this._deleteUserUseCase;
  }

  private _updateRoleUseCase?: UpdateRoleUseCase;
  get updateRoleUseCase(): UpdateRoleUseCase {
    if (!this._updateRoleUseCase) {
      this._updateRoleUseCase = new UpdateRoleUseCase(
        this.userRepository,
        this.membershipRepository,
        this.auditService
      );
    }
    return this._updateRoleUseCase;
  }

  private _setActiveUseCase?: SetActiveUseCase;
  get setActiveUseCase(): SetActiveUseCase {
    if (!this._setActiveUseCase) {
      this._setActiveUseCase = new SetActiveUseCase(
        this.userRepository,
        this.membershipRepository,
        this.refreshTokenRepository,
        this.auditService
      );
    }
    return this._setActiveUseCase;
  }

  // Tenant Use Cases
  private _listTenantsUseCase?: ListTenantsUseCase;
  get listTenantsUseCase(): ListTenantsUseCase {
    if (!this._listTenantsUseCase) {
      this._listTenantsUseCase = new ListTenantsUseCase(this.tenantRepository);
    }
    return this._listTenantsUseCase;
  }

  private _getTenantUseCase?: GetTenantUseCase;
  get getTenantUseCase(): GetTenantUseCase {
    if (!this._getTenantUseCase) {
      this._getTenantUseCase = new GetTenantUseCase(this.tenantRepository);
    }
    return this._getTenantUseCase;
  }

  private _createTenantUseCase?: CreateTenantUseCase;
  get createTenantUseCase(): CreateTenantUseCase {
    if (!this._createTenantUseCase) {
      this._createTenantUseCase = new CreateTenantUseCase(
        this.tenantRepository,
        this.auditService
      );
    }
    return this._createTenantUseCase;
  }

  private _updateTenantUseCase?: UpdateTenantUseCase;
  get updateTenantUseCase(): UpdateTenantUseCase {
    if (!this._updateTenantUseCase) {
      this._updateTenantUseCase = new UpdateTenantUseCase(
        this.tenantRepository,
        this.auditService
      );
    }
    return this._updateTenantUseCase;
  }

  private _suspendTenantUseCase?: SuspendTenantUseCase;
  get suspendTenantUseCase(): SuspendTenantUseCase {
    if (!this._suspendTenantUseCase) {
      this._suspendTenantUseCase = new SuspendTenantUseCase(
        this.tenantRepository,
        this.auditService
      );
    }
    return this._suspendTenantUseCase;
  }

  private _activateTenantUseCase?: ActivateTenantUseCase;
  get activateTenantUseCase(): ActivateTenantUseCase {
    if (!this._activateTenantUseCase) {
      this._activateTenantUseCase = new ActivateTenantUseCase(
        this.tenantRepository,
        this.auditService
      );
    }
    return this._activateTenantUseCase;
  }

  // Patient Use Cases
  private _listPatientsUseCase?: ListPatientsUseCase;
  get listPatientsUseCase(): ListPatientsUseCase {
    if (!this._listPatientsUseCase) {
      this._listPatientsUseCase = new ListPatientsUseCase(this.patientRepository);
    }
    return this._listPatientsUseCase;
  }

  private _getPatientUseCase?: GetPatientUseCase;
  get getPatientUseCase(): GetPatientUseCase {
    if (!this._getPatientUseCase) {
      this._getPatientUseCase = new GetPatientUseCase(this.patientRepository);
    }
    return this._getPatientUseCase;
  }

  private _createPatientUseCase?: CreatePatientUseCase;
  get createPatientUseCase(): CreatePatientUseCase {
    if (!this._createPatientUseCase) {
      this._createPatientUseCase = new CreatePatientUseCase(
        this.patientRepository,
        this.auditService
      );
    }
    return this._createPatientUseCase;
  }

  private _updatePatientUseCase?: UpdatePatientUseCase;
  get updatePatientUseCase(): UpdatePatientUseCase {
    if (!this._updatePatientUseCase) {
      this._updatePatientUseCase = new UpdatePatientUseCase(
        this.patientRepository,
        this.auditService
      );
    }
    return this._updatePatientUseCase;
  }

  private _deletePatientUseCase?: DeletePatientUseCase;
  get deletePatientUseCase(): DeletePatientUseCase {
    if (!this._deletePatientUseCase) {
      this._deletePatientUseCase = new DeletePatientUseCase(
        this.patientRepository,
        this.auditService
      );
    }
    return this._deletePatientUseCase;
  }

  // Template Use Cases
  private _listTemplatesUseCase?: ListTemplatesUseCase;
  get listTemplatesUseCase(): ListTemplatesUseCase {
    if (!this._listTemplatesUseCase) {
      this._listTemplatesUseCase = new ListTemplatesUseCase(this.templateRepository);
    }
    return this._listTemplatesUseCase;
  }

  private _getTemplateUseCase?: GetTemplateUseCase;
  get getTemplateUseCase(): GetTemplateUseCase {
    if (!this._getTemplateUseCase) {
      this._getTemplateUseCase = new GetTemplateUseCase(this.templateRepository);
    }
    return this._getTemplateUseCase;
  }

  private _createTemplateUseCase?: CreateTemplateUseCase;
  get createTemplateUseCase(): CreateTemplateUseCase {
    if (!this._createTemplateUseCase) {
      this._createTemplateUseCase = new CreateTemplateUseCase(this.templateRepository);
    }
    return this._createTemplateUseCase;
  }

  private _updateTemplateUseCase?: UpdateTemplateUseCase;
  get updateTemplateUseCase(): UpdateTemplateUseCase {
    if (!this._updateTemplateUseCase) {
      this._updateTemplateUseCase = new UpdateTemplateUseCase(this.templateRepository);
    }
    return this._updateTemplateUseCase;
  }

  private _deleteTemplateUseCase?: DeleteTemplateUseCase;
  get deleteTemplateUseCase(): DeleteTemplateUseCase {
    if (!this._deleteTemplateUseCase) {
      this._deleteTemplateUseCase = new DeleteTemplateUseCase(this.templateRepository);
    }
    return this._deleteTemplateUseCase;
  }

  // Session Use Cases
  private _listSessionsUseCase?: ListSessionsUseCase;
  get listSessionsUseCase(): ListSessionsUseCase {
    if (!this._listSessionsUseCase) {
      this._listSessionsUseCase = new ListSessionsUseCase(this.sessionRepository);
    }
    return this._listSessionsUseCase;
  }

  private _getSessionUseCase?: GetSessionUseCase;
  get getSessionUseCase(): GetSessionUseCase {
    if (!this._getSessionUseCase) {
      this._getSessionUseCase = new GetSessionUseCase(this.sessionRepository);
    }
    return this._getSessionUseCase;
  }

  private _createSessionUseCase?: CreateSessionUseCase;
  get createSessionUseCase(): CreateSessionUseCase {
    if (!this._createSessionUseCase) {
      this._createSessionUseCase = new CreateSessionUseCase(
        this.sessionRepository,
        this.templateRepository,
        this.patientRepository
      );
    }
    return this._createSessionUseCase;
  }

  private _answerQuestionUseCase?: AnswerQuestionUseCase;
  get answerQuestionUseCase(): AnswerQuestionUseCase {
    if (!this._answerQuestionUseCase) {
      this._answerQuestionUseCase = new AnswerQuestionUseCase(
        this.sessionRepository,
        this.templateRepository,
        this.questionEngine
      );
    }
    return this._answerQuestionUseCase;
  }

  private _signSessionUseCase?: SignSessionUseCase;
  get signSessionUseCase(): SignSessionUseCase {
    if (!this._signSessionUseCase) {
      this._signSessionUseCase = new SignSessionUseCase(
        this.sessionRepository,
        this.auditService
      );
    }
    return this._signSessionUseCase;
  }

  private _generateFillLinkUseCase?: GenerateFillLinkUseCase;
  get generateFillLinkUseCase(): GenerateFillLinkUseCase {
    if (!this._generateFillLinkUseCase) {
      this._generateFillLinkUseCase = new GenerateFillLinkUseCase(this.sessionRepository);
    }
    return this._generateFillLinkUseCase;
  }

  private _getNextQuestionUseCase?: GetNextQuestionUseCase;
  get getNextQuestionUseCase(): GetNextQuestionUseCase {
    if (!this._getNextQuestionUseCase) {
      this._getNextQuestionUseCase = new GetNextQuestionUseCase(
        this.sessionRepository,
        this.templateRepository,
        this.questionEngine
      );
    }
    return this._getNextQuestionUseCase;
  }

  private _publicGetSessionByTokenUseCase?: PublicGetSessionByTokenUseCase;
  get publicGetSessionByTokenUseCase(): PublicGetSessionByTokenUseCase {
    if (!this._publicGetSessionByTokenUseCase) {
      this._publicGetSessionByTokenUseCase = new PublicGetSessionByTokenUseCase(
        this.sessionRepository,
        this.templateRepository
      );
    }
    return this._publicGetSessionByTokenUseCase;
  }

  private _publicGetNextQuestionUseCase?: PublicGetNextQuestionUseCase;
  get publicGetNextQuestionUseCase(): PublicGetNextQuestionUseCase {
    if (!this._publicGetNextQuestionUseCase) {
      this._publicGetNextQuestionUseCase = new PublicGetNextQuestionUseCase(
        this.sessionRepository,
        this.templateRepository,
        this.questionEngine
      );
    }
    return this._publicGetNextQuestionUseCase;
  }

  private _publicSubmitAnswerUseCase?: PublicSubmitAnswerUseCase;
  get publicSubmitAnswerUseCase(): PublicSubmitAnswerUseCase {
    if (!this._publicSubmitAnswerUseCase) {
      this._publicSubmitAnswerUseCase = new PublicSubmitAnswerUseCase(
        this.sessionRepository,
        this.templateRepository,
        this.questionEngine
      );
    }
    return this._publicSubmitAnswerUseCase;
  }

  private _publicSignSessionUseCase?: PublicSignSessionUseCase;
  get publicSignSessionUseCase(): PublicSignSessionUseCase {
    if (!this._publicSignSessionUseCase) {
      this._publicSignSessionUseCase = new PublicSignSessionUseCase(this.sessionRepository);
    }
    return this._publicSignSessionUseCase;
  }

  private _generateInsightsUseCase?: GenerateInsightsUseCase;
  get generateInsightsUseCase(): GenerateInsightsUseCase {
    if (!this._generateInsightsUseCase) {
      this._generateInsightsUseCase = new GenerateInsightsUseCase(
        this.sessionRepository,
        this.templateRepository,
        this.insightRepository,
        this.insightGenerator,
        this.insightCache,
        this.auditService,
        this.logger
      );
    }
    return this._generateInsightsUseCase;
  }

  private _getInsightBySessionUseCase?: GetInsightBySessionUseCase;
  get getInsightBySessionUseCase(): GetInsightBySessionUseCase {
    if (!this._getInsightBySessionUseCase) {
      this._getInsightBySessionUseCase = new GetInsightBySessionUseCase(this.insightRepository);
    }
    return this._getInsightBySessionUseCase;
  }

  private _listAuditLogsUseCase?: ListAuditLogsUseCase;
  get listAuditLogsUseCase(): ListAuditLogsUseCase {
    if (!this._listAuditLogsUseCase) {
      this._listAuditLogsUseCase = new ListAuditLogsUseCase(this.auditQueryRepository);
    }
    return this._listAuditLogsUseCase;
  }

  private _getDashboardStatsUseCase?: GetDashboardStatsUseCase;
  get getDashboardStatsUseCase(): GetDashboardStatsUseCase {
    if (!this._getDashboardStatsUseCase) {
      this._getDashboardStatsUseCase = new GetDashboardStatsUseCase(this.statsRepository);
    }
    return this._getDashboardStatsUseCase;
  }

  private _getTemplateReportUseCase?: GetTemplateReportUseCase;
  get getTemplateReportUseCase(): GetTemplateReportUseCase {
    if (!this._getTemplateReportUseCase) {
      this._getTemplateReportUseCase = new GetTemplateReportUseCase(this.statsRepository);
    }
    return this._getTemplateReportUseCase;
  }

  private _listGoalsUseCase?: ListGoalsUseCase;
  get listGoalsUseCase(): ListGoalsUseCase {
    if (!this._listGoalsUseCase) {
      this._listGoalsUseCase = new ListGoalsUseCase(this.goalRepository);
    }
    return this._listGoalsUseCase;
  }

  private _getGoalUseCase?: GetGoalUseCase;
  get getGoalUseCase(): GetGoalUseCase {
    if (!this._getGoalUseCase) {
      this._getGoalUseCase = new GetGoalUseCase(this.goalRepository, this.patientRepository);
    }
    return this._getGoalUseCase;
  }

  private _createGoalUseCase?: CreateGoalUseCase;
  get createGoalUseCase(): CreateGoalUseCase {
    if (!this._createGoalUseCase) {
      this._createGoalUseCase = new CreateGoalUseCase(
        this.goalRepository,
        this.patientRepository,
        this.auditService
      );
    }
    return this._createGoalUseCase;
  }

  private _updateGoalUseCase?: UpdateGoalUseCase;
  get updateGoalUseCase(): UpdateGoalUseCase {
    if (!this._updateGoalUseCase) {
      this._updateGoalUseCase = new UpdateGoalUseCase(this.goalRepository, this.auditService);
    }
    return this._updateGoalUseCase;
  }

  private _deleteGoalUseCase?: DeleteGoalUseCase;
  get deleteGoalUseCase(): DeleteGoalUseCase {
    if (!this._deleteGoalUseCase) {
      this._deleteGoalUseCase = new DeleteGoalUseCase(this.goalRepository, this.auditService);
    }
    return this._deleteGoalUseCase;
  }

  // Controllers
  private _authController?: AuthController;
  get authController(): AuthController {
    if (!this._authController) {
      this._authController = new AuthController(
        this.loginUseCase,
        this.refreshTokenUseCase,
        this.logoutUseCase,
        this.registerUseCase
      );
    }
    return this._authController;
  }

  private _userController?: UserController;
  get userController(): UserController {
    if (!this._userController) {
      this._userController = new UserController(
        this.listUsersUseCase,
        this.getUserUseCase,
        this.createUserUseCase,
        this.deleteUserUseCase,
        this.updateRoleUseCase,
        this.setActiveUseCase,
        this.exportUserDataUseCase,
        this.membershipRepository
      );
    }
    return this._userController;
  }

  private _tenantController?: TenantController;
  get tenantController(): TenantController {
    if (!this._tenantController) {
      this._tenantController = new TenantController(
        this.listTenantsUseCase,
        this.getTenantUseCase,
        this.createTenantUseCase,
        this.updateTenantUseCase,
        this.suspendTenantUseCase,
        this.activateTenantUseCase
      );
    }
    return this._tenantController;
  }

  private _patientController?: PatientController;
  get patientController(): PatientController {
    if (!this._patientController) {
      this._patientController = new PatientController(
        this.listPatientsUseCase,
        this.getPatientUseCase,
        this.createPatientUseCase,
        this.updatePatientUseCase,
        this.deletePatientUseCase
      );
    }
    return this._patientController;
  }

  private _templateController?: TemplateController;
  get templateController(): TemplateController {
    if (!this._templateController) {
      this._templateController = new TemplateController(
        this.listTemplatesUseCase,
        this.getTemplateUseCase,
        this.createTemplateUseCase,
        this.updateTemplateUseCase,
        this.deleteTemplateUseCase
      );
    }
    return this._templateController;
  }

  private _sessionController?: SessionController;
  get sessionController(): SessionController {
    if (!this._sessionController) {
      this._sessionController = new SessionController(
        this.listSessionsUseCase,
        this.getSessionUseCase,
        this.createSessionUseCase,
        this.answerQuestionUseCase,
        this.signSessionUseCase,
        this.generateFillLinkUseCase,
        this.getNextQuestionUseCase,
        this.publicGetSessionByTokenUseCase,
        this.publicGetNextQuestionUseCase,
        this.publicSubmitAnswerUseCase,
        this.publicSignSessionUseCase,
        this.getTemplateUseCase,
        this.getPatientUseCase,
        this.prisma
      );
    }
    return this._sessionController;
  }

  private _insightController?: InsightController;
  get insightController(): InsightController {
    if (!this._insightController) {
      this._insightController = new InsightController(
        this.generateInsightsUseCase,
        this.getInsightBySessionUseCase,
        this.prisma
      );
    }
    return this._insightController;
  }

  private _auditController?: AuditController;
  get auditController(): AuditController {
    if (!this._auditController) {
      this._auditController = new AuditController(this.listAuditLogsUseCase);
    }
    return this._auditController;
  }

  private _statsController?: StatsController;
  get statsController(): StatsController {
    if (!this._statsController) {
      this._statsController = new StatsController(
        this.getDashboardStatsUseCase,
        this.getTemplateReportUseCase
      );
    }
    return this._statsController;
  }

  private _goalController?: GoalController;
  get goalController(): GoalController {
    if (!this._goalController) {
      this._goalController = new GoalController(
        this.listGoalsUseCase,
        this.getGoalUseCase,
        this.createGoalUseCase,
        this.updateGoalUseCase,
        this.deleteGoalUseCase
      );
    }
    return this._goalController;
  }
}
