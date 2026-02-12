import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
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
                schemaJson: templateSchema,
            },
        });
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
//# sourceMappingURL=seed.js.map