import { getMyNotifications } from './notifications';
import { apiFetch } from './client';

jest.mock('./client', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.Mock;

describe('notifications api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes backend notifications into mobile-friendly items', async () => {
    mockApiFetch.mockResolvedValue({
      data: [
        {
          id: 'notif-1',
          type: 'questionnaire_session_created',
          metadata: {
            questionnaireName: 'Check-in Semanal',
            fillToken: 'fill-123',
          },
          readAt: null,
          createdAt: '2026-03-10T10:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasMore: false },
    });

    const result = await getMyNotifications('token', 'tenant');

    expect(result.data).toEqual([
      {
        id: 'notif-1',
        title: 'Nova anamnese disponível',
        body: 'Preencha seu questionário para que seu profissional acompanhe sua evolução.',
        read: false,
        createdAt: '2026-03-10T10:00:00.000Z',
        type: 'questionnaire_session_created',
        metadata: {
          questionnaireName: 'Check-in Semanal',
          fillToken: 'fill-123',
        },
      },
    ]);
  });
});
