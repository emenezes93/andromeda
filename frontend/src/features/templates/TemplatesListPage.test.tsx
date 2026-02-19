import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TemplatesListPage } from './TemplatesListPage';
import { listTemplates } from '@/api/templates';

vi.mock('@/api/templates', () => ({
  listTemplates: vi.fn(),
}));

function renderList() {
  return render(
    <MemoryRouter>
      <TemplatesListPage />
    </MemoryRouter>,
  );
}

describe('TemplatesListPage', () => {
  beforeEach(() => {
    vi.mocked(listTemplates).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, totalPages: 1, total: 0, hasMore: false },
    });
  });

  it('shows empty state when there are no templates', async () => {
    renderList();
    expect(await screen.findByText(/0 template\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhum template ainda/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /novo template/i })).toBeInTheDocument();
  });
});
