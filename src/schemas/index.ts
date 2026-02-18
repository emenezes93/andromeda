import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { loginBodySchema, registerBodySchema, refreshBodySchema, logoutBodySchema } from '../modules/auth/schemas.js';
import { createTenantSchema } from '../modules/tenants/schemas.js';
import { createUserSchema } from '../modules/users/schemas.js';
import { createTemplateSchema } from '../modules/anamnesis/templates/schemas.js';
import { createSessionSchema, createAnswersSchema } from '../modules/anamnesis/sessions/schemas.js';

export function registerSchemas(app: FastifyInstance): void {
  app.addSchema({
    $id: 'LoginBody',
    ...zodToJsonSchema(loginBodySchema),
  });
  app.addSchema({
    $id: 'LoginResponse',
    type: 'object',
    properties: {
      token: { type: 'string' },
      refreshToken: { type: 'string' },
      expiresIn: { type: 'number' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string', nullable: true },
          role: { type: 'string' },
          tenantId: { type: 'string' },
        },
      },
    },
  });
  app.addSchema({
    $id: 'RefreshBody',
    ...zodToJsonSchema(refreshBodySchema),
  });
  app.addSchema({
    $id: 'RefreshResponse',
    type: 'object',
    properties: {
      token: { type: 'string' },
      refreshToken: { type: 'string' },
      expiresIn: { type: 'number' },
    },
  });
  app.addSchema({
    $id: 'LogoutBody',
    ...zodToJsonSchema(logoutBodySchema),
  });
  app.addSchema({
    $id: 'RegisterBody',
    ...zodToJsonSchema(registerBodySchema),
  });
  app.addSchema({
    $id: 'UserResponse',
    type: 'object',
    properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } },
  });
  app.addSchema({
    $id: 'CreateTenantBody',
    ...zodToJsonSchema(createTenantSchema),
  });
  app.addSchema({
    $id: 'TenantResponse',
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' }, status: { type: 'string' }, createdAt: { type: 'string' } },
  });
  app.addSchema({
    $id: 'CreateUserBody',
    ...zodToJsonSchema(createUserSchema),
  });
  app.addSchema({
    $id: 'CreateTemplateBody',
    ...zodToJsonSchema(createTemplateSchema),
  });
  app.addSchema({
    $id: 'TemplateResponse',
    type: 'object',
    properties: { id: { type: 'string' }, tenantId: { type: 'string' }, name: { type: 'string' }, version: { type: 'number' }, schemaJson: { type: 'object' }, createdAt: { type: 'string' } },
  });
  app.addSchema({
    $id: 'TemplateListResponse',
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'object', additionalProperties: true } },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          total: { type: 'number' },
          totalPages: { type: 'number' },
          hasMore: { type: 'boolean' },
        },
      },
    },
  });
  app.addSchema({
    $id: 'CreateSessionBody',
    ...zodToJsonSchema(createSessionSchema),
  });
  app.addSchema({
    $id: 'SessionResponse',
    type: 'object',
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string' },
      templateId: { type: 'string' },
      subjectId: { type: 'string', nullable: true },
      status: { type: 'string' },
      createdAt: { type: 'string' },
      template: { type: 'object', additionalProperties: true },
      answers: { type: 'array', items: { type: 'object', additionalProperties: true } },
    },
  });
  app.addSchema({
    $id: 'CreateAnswersBody',
    ...zodToJsonSchema(createAnswersSchema),
  });
  app.addSchema({
    $id: 'AnswerResponse',
    type: 'object',
    properties: { id: { type: 'string' }, sessionId: { type: 'string' }, answersJson: { type: 'object' }, createdAt: { type: 'string' } },
  });
  app.addSchema({
    $id: 'NextQuestionBody',
    type: 'object',
    properties: { sessionId: { type: 'string' }, currentAnswers: { type: 'object' } },
  });
  app.addSchema({
    $id: 'NextQuestionResponse',
    type: 'object',
    properties: {
      nextQuestion: {
        nullable: true,
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean' },
          options: { type: 'array', items: { type: 'string' }, nullable: true },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
        },
      },
      reason: { type: 'string' },
      completionPercent: { type: 'number' },
    },
  });
  app.addSchema({
    $id: 'AiInsightResponse',
    type: 'object',
    properties: {
      id: { type: 'string' },
      sessionId: { type: 'string' },
      summary: { type: 'string' },
      risksJson: {
        type: 'object',
        properties: {
          readiness: { type: 'number' },
          dropoutRisk: { type: 'number' },
          stress: { type: 'number' },
          sleepQuality: { type: 'number' },
        },
        additionalProperties: true,
      },
      recommendationsJson: { type: 'object' },
      createdAt: { type: 'string' },
    },
  });
  app.addSchema({
    $id: 'AuditListResponse',
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'object', additionalProperties: true } },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          total: { type: 'number' },
          totalPages: { type: 'number' },
          hasMore: { type: 'boolean' },
        },
      },
    },
  });
}
