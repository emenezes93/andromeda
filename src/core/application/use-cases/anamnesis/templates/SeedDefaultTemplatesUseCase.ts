import type { TemplateSchemaJson } from '@shared/types/index.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';

const DEFAULT_TEMPLATES: { name: string; schema: TemplateSchemaJson }[] = [
  {
    name: 'Anamnese Inicial Completa',
    schema: {
      questions: [
        { id: 'q1', text: 'Possui algum problema de saúde ou condição médica que devemos considerar?', type: 'text', required: true, tags: ['health'] },
        { id: 'q2', text: 'Quais são seus principais objetivos com o treino?', type: 'multiple', options: ['Perda de peso', 'Ganho de massa muscular', 'Condicionamento', 'Melhora da postura', 'Outro'], required: true, tags: ['motivation'] },
        { id: 'q3', text: 'Tem restrições ou lesões que limitam a prática de exercícios?', type: 'text', required: false, tags: ['injury'] },
        { id: 'q4', text: 'Quantos dias por semana você pode treinar?', type: 'number', required: true, tags: ['motivation'] },
        { id: 'q5', text: 'Como você avalia a qualidade do seu sono?', type: 'single', options: ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Muito bom'], required: true, tags: ['sleep'] },
        { id: 'q6', text: 'Quantas horas por noite você costuma dormir?', type: 'number', required: false, tags: ['sleep'] },
        { id: 'q7', text: 'Como está sua alimentação no dia a dia?', type: 'single', options: ['Muito irregular', 'Irregular', 'Regular', 'Boa', 'Muito boa'], required: true, tags: ['food_emotional'] },
        { id: 'q8', text: 'Você se sente estressado ou sobrecarregado com frequência?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], required: true, tags: ['stress'] },
        { id: 'q9', text: 'Pratica ou já praticou atividades físicas regularmente? Quais?', type: 'text', required: false, tags: [] },
        { id: 'q10', text: 'Usa medicação contínua? Se sim, quais?', type: 'text', required: false, tags: ['health'] },
        { id: 'q11', text: 'Tabagismo ou consumo de álcool?', type: 'text', required: false, tags: [] },
        { id: 'q12', text: 'Alguma dor crônica ou desconforto recorrente?', type: 'text', required: false, tags: ['injury'] },
        { id: 'q13', text: 'Como descreveria seu nível de energia ao longo do dia?', type: 'single', options: ['Muito baixo', 'Baixo', 'Regular', 'Bom', 'Muito bom'], required: true, tags: ['stress'] },
        { id: 'q14', text: 'Algo mais que queira compartilhar com seu profissional?', type: 'text', required: false, tags: [] },
        { id: 'q15', text: 'Qual sua disponibilidade de horários para treinos?', type: 'text', required: false, tags: ['motivation'] },
      ],
      tags: ['stress', 'sleep', 'food_emotional', 'injury', 'motivation'],
    },
  },
  {
    name: 'Reavaliação Mensal',
    schema: {
      questions: [
        { id: 'q1', text: 'Como você avalia sua evolução no último mês?', type: 'single', options: ['Muito abaixo do esperado', 'Abaixo do esperado', 'Como esperado', 'Acima do esperado', 'Muito acima'], required: true, tags: ['motivation'] },
        { id: 'q2', text: 'Teve alguma dor ou desconforto que atrapalhou os treinos?', type: 'text', required: false, tags: ['injury'] },
        { id: 'q3', text: 'Conseguiu manter a frequência de treinos planejada?', type: 'single', options: ['Não', 'Parcialmente', 'Sim'], required: true, tags: ['motivation'] },
        { id: 'q4', text: 'Houve mudanças na alimentação ou no sono?', type: 'text', required: false, tags: ['sleep', 'food_emotional'] },
        { id: 'q5', text: 'Como está seu nível de estresse comparado ao mês passado?', type: 'single', options: ['Muito pior', 'Pior', 'Igual', 'Melhor', 'Muito melhor'], required: true, tags: ['stress'] },
        { id: 'q6', text: 'Algum objetivo que queira ajustar para o próximo mês?', type: 'text', required: false, tags: ['motivation'] },
        { id: 'q7', text: 'O que funcionou bem e quer manter?', type: 'text', required: false, tags: [] },
        { id: 'q8', text: 'Alguma dificuldade ou barreira que queira comentar?', type: 'text', required: false, tags: ['stress'] },
      ],
      tags: ['stress', 'sleep', 'food_emotional', 'injury', 'motivation'],
    },
  },
  {
    name: 'Check-in Semanal',
    schema: {
      questions: [
        { id: 'q1', text: 'Quantos treinos você realizou esta semana?', type: 'number', required: true, tags: ['motivation'] },
        { id: 'q2', text: 'Como está sua alimentação esta semana?', type: 'single', options: ['Muito ruim', 'Ruim', 'Regular', 'Boa', 'Muito boa'], required: true, tags: ['food_emotional'] },
        { id: 'q3', text: 'Como está a qualidade do seu sono?', type: 'single', options: ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Muito bom'], required: true, tags: ['sleep'] },
        { id: 'q4', text: 'Como está seu nível de energia e disposição?', type: 'single', options: ['Muito baixo', 'Baixo', 'Regular', 'Bom', 'Muito bom'], required: true, tags: ['stress'] },
        { id: 'q5', text: 'Como está seu humor e motivação em relação ao treino?', type: 'sentiment', required: true, tags: ['motivation'] },
      ],
      tags: ['stress', 'sleep', 'food_emotional', 'motivation'],
    },
  },
  {
    name: 'Avaliação de Dor/Lesão',
    schema: {
      questions: [
        { id: 'q1', text: 'Onde você sente a dor ou desconforto?', type: 'text', required: true, tags: ['injury'] },
        { id: 'q2', text: 'Em uma escala de 0 a 10, qual a intensidade da dor?', type: 'number', required: true, tags: ['injury'] },
        { id: 'q3', text: 'Quando a dor piora?', type: 'single', options: ['Em repouso', 'Ao movimentar', 'Após o treino', 'Durante o treino', 'Outro'], required: false, tags: ['injury'] },
        { id: 'q4', text: 'Há quanto tempo sente isso?', type: 'text', required: false, tags: ['injury'] },
        { id: 'q5', text: 'Algum movimento ou exercício que você evita por causa disso?', type: 'text', required: false, tags: ['injury'] },
        { id: 'q6', text: 'Já fez algum tratamento ou avaliação médica para isso?', type: 'text', required: false, tags: ['injury'] },
      ],
      tags: ['injury'],
    },
  },
  {
    name: 'Satisfação e Feedback',
    schema: {
      questions: [
        { id: 'q1', text: 'De 0 a 10, como você avalia o atendimento e o acompanhamento?', type: 'number', required: true, tags: [] },
        { id: 'q2', text: 'Quais os principais pontos positivos?', type: 'text', required: false, tags: [] },
        { id: 'q3', text: 'O que poderia ser melhorado?', type: 'text', required: false, tags: [] },
        { id: 'q4', text: 'Você recomendaria nosso trabalho para um amigo ou familiar?', type: 'single', options: ['Não', 'Talvez', 'Sim', 'Com certeza'], required: true, tags: [] },
      ],
      tags: [],
    },
  },
];

export class SeedDefaultTemplatesUseCase {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  async execute(tenantId: string): Promise<void> {
    for (const { name, schema } of DEFAULT_TEMPLATES) {
      await this.templateRepository.create({
        tenantId,
        name,
        schemaJson: schema as unknown,
      });
    }
  }
}
