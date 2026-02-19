import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { anamneseCompletaSchema } from './seed-data/anamnese-completa.js';
import {
  templateEmagrecimento,
  templateGanhoMassa,
  templateMelhoriaSaude,
  templateManterBomCorpo,
} from './seed-data/templates-gamificados.js';

const prisma = new PrismaClient();

const templateSchema = {
  questions: [
    { id: 'q1', text: 'Como você avalia sua qualidade de sono (1-10)?', type: 'number', required: true, tags: ['sleep'] },
    { id: 'q2', text: 'Quantas horas você dorme em média por noite?', type: 'number', required: true, tags: ['sleep'] },
    { id: 'q3', text: 'Você se sente estressado(a) com frequência?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], required: true, tags: ['stress'] },
    { id: 'q4', text: 'Qual seu nível de estresse hoje (1-10)?', type: 'number', required: false, tags: ['stress'], showWhen: { questionId: 'q3', operator: 'in', value: ['Frequentemente', 'Sempre'] } },
    { id: 'q5', text: 'Você come por ansiedade ou emoção?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'], required: true, tags: ['food_emotional'] },
    { id: 'q6', text: 'Com que frequência você pratica atividade física?', type: 'single', options: ['Nunca', '1-2x/semana', '3-4x/semana', '5+ vezes/semana'], required: true, tags: [] },
    { id: 'q7', text: 'Você toma algum medicamento contínuo?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
    { id: 'q8', text: 'Quais medicamentos (se sim)?', type: 'text', required: false, tags: [], showWhen: { questionId: 'q7', operator: 'eq', value: 'Sim' } },
    { id: 'q9', text: 'Objetivo principal com o programa:', type: 'single', options: ['Perda de peso', 'Ganho de massa', 'Melhorar saúde', 'Outro'], required: true, tags: [] },
    { id: 'q10', text: 'Alguma condição de saúde que devemos saber?', type: 'text', required: false, tags: [] },
  ],
  conditionalLogic: [
    { ifQuestion: 'q3', ifValue: ['Frequentemente', 'Sempre'], thenShow: ['q4'] },
    { ifQuestion: 'q7', ifValue: ['Sim'], thenShow: ['q8'] },
  ],
  tags: ['sleep', 'stress', 'food_emotional'],
};

// Template alinhado ao cadastro Medidas & Evolução (documento MEDIDAS_EVOLUCAO_ESTRUTURA.md)
const medidasEvolucaoSchema = {
  questions: [
    { id: 'obj', text: 'Objetivo principal com o programa:', type: 'single', options: ['Perda de peso', 'Ganho de massa', 'Melhorar saúde', 'Performance', 'Outro'], required: true, tags: ['goal'] },
    { id: 'queixa', text: 'Queixa principal (o que mais te traz hoje)?', type: 'text', required: false, tags: [] },
    { id: 'peso', text: 'Peso atual (kg):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'altura', text: 'Altura (cm):', type: 'number', required: true, tags: ['anthropometry'] },
    { id: 'cintura', text: 'Circunferência da cintura (cm):', type: 'number', required: false, tags: ['anthropometry'] },
    { id: 'quadril', text: 'Circunferência do quadril (cm):', type: 'number', required: false, tags: ['anthropometry'] },
    { id: 'pa_sist', text: 'Pressão arterial - sistólica (mmHg):', type: 'number', required: false, tags: ['vitals'] },
    { id: 'pa_diast', text: 'Pressão arterial - diastólica (mmHg):', type: 'number', required: false, tags: ['vitals'] },
    { id: 'fc', text: 'Frequência cardíaca em repouso (bpm):', type: 'number', required: false, tags: ['vitals'] },
    { id: 'atividade', text: 'Com que frequência você pratica atividade física?', type: 'single', options: ['Nunca', '1-2x/semana', '3-4x/semana', '5+ vezes/semana'], required: true, tags: [] },
    { id: 'medicamentos', text: 'Você toma algum medicamento contínuo?', type: 'single', options: ['Não', 'Sim'], required: true, tags: [] },
    { id: 'medicamentos_quais', text: 'Quais medicamentos?', type: 'text', required: false, tags: [], showWhen: { questionId: 'medicamentos', operator: 'eq', value: 'Sim' } },
    { id: 'condicoes', text: 'Alguma condição de saúde que devemos saber (ex.: diabetes, HAS)?', type: 'text', required: false, tags: [] },
    { id: 'disposicao', text: 'Como você avalia sua disposição hoje (1-10)?', type: 'number', required: true, tags: ['readiness'] },
  ],
  conditionalLogic: [
    { ifQuestion: 'medicamentos', ifValue: ['Sim'], thenShow: ['medicamentos_quais'] },
  ],
  tags: ['goal', 'anthropometry', 'vitals', 'readiness'],
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

  const existingTemplate = await prisma.anamnesisTemplate.findFirst({
    where: { tenantId: tenant.id, name: 'Anamnese Inicial - Bem-estar' },
  });
  if (!existingTemplate) {
    await prisma.anamnesisTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Anamnese Inicial - Bem-estar',
        version: 1,
        schemaJson: templateSchema as object,
      },
    });
  }

  const existingMedidas = await prisma.anamnesisTemplate.findFirst({
    where: { tenantId: tenant.id, name: 'Medidas & Evolução' },
  });
  if (!existingMedidas) {
    await prisma.anamnesisTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Medidas & Evolução',
        version: 1,
        schemaJson: medidasEvolucaoSchema as object,
      },
    });
  }

  const existingCompleta = await prisma.anamnesisTemplate.findFirst({
    where: { tenantId: tenant.id, name: 'Anamnese Completa' },
  });
  if (!existingCompleta) {
    await prisma.anamnesisTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Anamnese Completa',
        version: 1,
        schemaJson: { ...anamneseCompletaSchema } as object,
      },
    });
  }

  // ─── Templates Gamificados e Otimizados ────────────────────────────────────
  const templatesGamificados = [
    { name: 'Emagrecimento', schema: templateEmagrecimento },
    { name: 'Ganho de Massa Magra', schema: templateGanhoMassa },
    { name: 'Melhoria de Saúde', schema: templateMelhoriaSaude },
    { name: 'Manter Bom Corpo', schema: templateManterBomCorpo },
  ];

  for (const template of templatesGamificados) {
    const existing = await prisma.anamnesisTemplate.findFirst({
      where: { tenantId: tenant.id, name: template.name },
    });
    if (!existing) {
      await prisma.anamnesisTemplate.create({
        data: {
          tenantId: tenant.id,
          name: template.name,
          version: 1,
          schemaJson: template.schema as object,
        },
      });
    }
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
