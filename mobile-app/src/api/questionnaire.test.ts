import { getFillQuestionnaire, submitFillQuestionnaire } from './questionnaire';
import { apiFetch } from './client';

jest.mock('./client', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.Mock;

describe('questionnaire api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps backend public fill payload to mobile questionnaire format', async () => {
    mockApiFetch.mockResolvedValue({
      sessionId: 'session-1',
      tenantId: 'tenant-1',
      status: 'pending',
      templateName: 'Check-in Semanal',
      currentAnswers: { q1: 4 },
      schema: {
        questions: [
          {
            id: 'q1',
            text: 'Quantos treinos você realizou esta semana?',
            type: 'number',
            required: true,
          },
        ],
      },
    });

    const result = await getFillQuestionnaire('fill-token');

    expect(result).toEqual({
      id: 'session-1',
      title: 'Check-in Semanal',
      description: null,
      questions: [
        {
          id: 'q1',
          label: 'Quantos treinos você realizou esta semana?',
          description: null,
          type: 'number',
          required: true,
          options: undefined,
        },
      ],
      initialAnswers: { q1: 4 },
    });
  });

  it('submits answers to the public answers endpoint', async () => {
    mockApiFetch.mockResolvedValue({ completed: true });

    const result = await submitFillQuestionnaire('fill-token', {
      answers: [
        { questionId: 'q1', value: 4 },
        { questionId: 'q2', value: 'Boa' },
      ],
    });

    expect(result).toEqual({ success: true });
    expect(mockApiFetch).toHaveBeenCalledWith('/v1/public/fill/fill-token/answers', {
      method: 'POST',
      body: JSON.stringify({
        answersJson: {
          q1: 4,
          q2: 'Boa',
        },
      }),
    });
  });
});
