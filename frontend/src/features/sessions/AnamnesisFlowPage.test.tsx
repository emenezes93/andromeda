import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AnamnesisFlowPage } from './AnamnesisFlowPage';

// Mock the API calls
vi.mock('@/api/sessions', () => ({
  getSession: vi.fn().mockResolvedValue({
    id: '1',
    status: 'in_progress',
    template: {
      id: 't1',
      name: 'Test Template',
      schemaJson: {
        questions: [
          {
            id: 'q1',
            type: 'text',
            label: 'Test Question',
            required: false,
          },
        ],
      },
    },
    answersJson: {},
  }),
  updateSessionAnswers: vi.fn().mockResolvedValue({}),
}));

function renderAnamnesisFlow() {
  return render(
    <MemoryRouter>
      <AnamnesisFlowPage />
    </MemoryRouter>,
  );
}

describe('AnamnesisFlowPage', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderAnamnesisFlow();
    // Wait for async content to load
    await screen.findByText(/test question/i, {}, { timeout: 2000 }).catch(() => null);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
