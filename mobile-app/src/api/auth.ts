import { apiFetch } from './client';
import { ANDROMEDA_DEV_TOKEN } from './andromeda';
import type { LoginResponse } from '../types';

/** Credenciais de teste (só para desenvolvimento, sem backend) */
const DEV_TEST_TENANT = 'demo';
const DEV_TEST_EMAIL = 'teste@andromeda.demo';
const DEV_TEST_PASSWORD = '123456';

function isDevTestLogin(email: string, password: string, tenantId: string): boolean {
  return (
    tenantId.trim().toLowerCase() === DEV_TEST_TENANT &&
    email.trim().toLowerCase() === DEV_TEST_EMAIL &&
    password === DEV_TEST_PASSWORD
  );
}

export async function login(
  email: string,
  password: string,
  tenantId: string
): Promise<LoginResponse> {
  if (isDevTestLogin(email, password, tenantId)) {
    return Promise.resolve({
      token: ANDROMEDA_DEV_TOKEN,
      refreshToken: 'dev-refresh',
      user: {
        userId: 'dev-user-id',
        email: DEV_TEST_EMAIL,
        role: 'patient',
        tenantId: DEV_TEST_TENANT,
        patientId: 'dev-patient-id',
      },
    });
  }

  return apiFetch<LoginResponse>('/v1/patient-portal/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    tenantId,
  });
}

/** Registro de paciente (POST /v1/patient-portal/register). Profissional pode enviar link ou paciente se cadastra. */
export async function register(
  tenantId: string,
  fullName: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/v1/patient-portal/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
    tenantId,
  });
}

/** Resposta mock do /me para usuário de teste (dashboard) */
function getDevMockMe(): import('../types').MeResponse {
  return {
    patient: {
      id: 'dev-patient-id',
      fullName: 'Aluno Teste',
      email: 'teste@andromeda.demo',
      phone: null,
      birthDate: null,
    },
    sessionsCount: 12,
    evolutionsCount: 4,
    goalsCount: 3,
  };
}

export async function getMe(token: string, tenantId: string) {
  if (token === ANDROMEDA_DEV_TOKEN) {
    return Promise.resolve(getDevMockMe());
  }
  return apiFetch<import('../types').MeResponse>('/v1/patient-portal/me', {
    token,
    tenantId,
  });
}
