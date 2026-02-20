import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { anamneseCompletaSchema } from './seed-data/anamnese-completa.js';
import {
  templateEmagrecimento,
  templateGanhoMassa,
  templateMelhoriaSaude,
  templateManterBomCorpo,
} from './seed-data/templates-gamificados.js';
import {
  templateParQ,
  templateAnamnesePostural,
  templateCheckinSemanal,
  templateAvaliacaoNutricional,
  templateReavaliacao90,
} from './seed-data/templates-fitness.js';

const prisma = new PrismaClient();

// Máximo 10 perguntas; respostas estruturadas (número, single, sentiment) para insights assertivos
const templateSchema = {
  questions: [
    { id: 'q1', text: 'Como você avalia sua qualidade de sono (1-10)?', type: 'number', required: true, tags: ['sleep'] },
    { id: 'q2', text: 'Quantas horas você dorme em média por noite?', type: 'number', required: true, tags: ['sleep'] },
    { id: 'q3', text: 'Você se sente estressado(a) com frequência?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], required: true, tags: ['stress'] },
    { id: 'q4', text: 'Qual seu nível de estresse hoje (1-10)?', type: 'number', required: false, tags: ['stress'], showWhen: { questionId: 'q3', operator: 'in', value: ['Frequentemente', 'Sempre'] } },
    { id: 'q5', text: 'Você come por ansiedade ou emoção?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'], required: true, tags: ['food_emotional'] },
    { id: 'q6', text: 'Com que frequência você pratica atividade física?', type: 'single', options: ['Nunca', '1-2x/semana', '3-4x/semana', '5+ vezes/semana'], required: true, tags: [] },
    { id: 'q7', text: 'Você toma algum medicamento contínuo?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
    { id: 'q8', text: 'Objetivo principal com o programa:', type: 'single', options: ['Perda de peso', 'Ganho de massa', 'Melhorar saúde', 'Outro'], required: true, tags: ['goal'] },
    { id: 'q9', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
    { id: 'q10', text: 'Alguma condição de saúde que devemos saber?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
  ],
  conditionalLogic: [{ ifQuestion: 'q3', ifValue: ['Frequentemente', 'Sempre'], thenShow: ['q4'] }],
  tags: ['sleep', 'stress', 'food_emotional', 'goal', 'readiness'],
};

// Medidas & Evolução: máx. 10 perguntas; respostas estruturadas para insights
const medidasEvolucaoSchema = {
  questions: [
    { id: 'obj', text: 'Objetivo principal com o programa:', type: 'single', options: ['Perda de peso', 'Ganho de massa', 'Melhorar saúde', 'Performance', 'Outro'], required: true, tags: ['goal'] },
    { id: 'peso', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'altura', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'cintura', text: 'Circunferência da cintura (cm):', type: 'number', required: false, tags: ['anthropometry'] },
    { id: 'atividade', text: 'Com que frequência você pratica atividade física?', type: 'single', options: ['Nunca', '1-2x/semana', '3-4x/semana', '5+ vezes/semana'], required: true, tags: [] },
    { id: 'medicamentos', text: 'Você toma algum medicamento contínuo?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
    { id: 'disposicao', text: 'Como você avalia sua disposição hoje (1-10)?', type: 'number', required: true, tags: ['readiness'] },
    { id: 'sentimento_hoje', text: 'Como você está se sentindo hoje?', type: 'sentiment', required: true, tags: ['readiness'] },
    { id: 'condicoes_saude', text: 'Alguma condição de saúde que devemos saber?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
  ],
  conditionalLogic: [],
  tags: ['goal', 'anthropometry', 'readiness'],
};

async function main() {
  const passwordHash = await bcrypt.hash('owner123', 12);

  let tenant = await prisma.tenant.findFirst({ where: { name: 'Clínica Demo' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Clínica Demo', status: 'active' },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash,
      name: 'Owner Demo',
    },
  });

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
    },
  });

  // Templates: upsert para aplicar melhorias (máx. 10 perguntas + sentiment) mesmo quando já existem
  const upsertTemplate = async (
    name: string,
    schemaJson: object,
    version: number = 1
  ) => {
    const existing = await prisma.anamnesisTemplate.findFirst({
      where: { tenantId: tenant.id, name },
    });
    if (existing) {
      await prisma.anamnesisTemplate.update({
        where: { id: existing.id },
        data: { schemaJson, version },
      });
    } else {
      await prisma.anamnesisTemplate.create({
        data: {
          tenantId: tenant.id,
          name,
          version,
          schemaJson,
        },
      });
    }
  };

  await upsertTemplate('Anamnese Inicial - Bem-estar', templateSchema as object);
  await upsertTemplate('Medidas & Evolução', medidasEvolucaoSchema as object);
  await upsertTemplate('Anamnese Completa', { ...anamneseCompletaSchema } as object);

  const templatesGamificados = [
    { name: 'Emagrecimento', schema: templateEmagrecimento },
    { name: 'Ganho de Massa Magra', schema: templateGanhoMassa },
    { name: 'Melhoria de Saúde', schema: templateMelhoriaSaude },
    { name: 'Manter Bom Corpo', schema: templateManterBomCorpo },
  ];
  for (const t of templatesGamificados) {
    await upsertTemplate(t.name, t.schema as object);
  }

  const templatesFitness = [
    { name: 'PAR-Q (Prontidão para Atividade Física)', schema: templateParQ },
    { name: 'Anamnese Postural Inicial', schema: templateAnamnesePostural },
    { name: 'Check-in Semanal', schema: templateCheckinSemanal },
    { name: 'Avaliação Nutricional Básica', schema: templateAvaliacaoNutricional },
    { name: 'Reavaliação 90 dias', schema: templateReavaliacao90 },
  ];
  for (const t of templatesFitness) {
    await upsertTemplate(t.name, t.schema as object);
  }

  console.log('Seed OK:', { tenant: tenant.name, user: user.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
