import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';
import { PatientFormPage } from './PatientFormPage';
import { ToastProvider } from '@/components/ui/Toast';
import { vi } from 'vitest';

vi.mock('@/hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({
    showConfirmModal: false,
    confirmLeave: () => {},
    cancelLeave: () => {},
    message: '',
  }),
}));

function renderPatientForm() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <PatientFormPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('PatientFormPage', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderPatientForm();
    const results = await axe(container);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });

  it('renders form with "Dados do aluno" card and section headings', () => {
    const { getByRole } = renderPatientForm();
    expect(getByRole('heading', { name: /dados do aluno/i })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Dados pessoais' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Objetivo e queixa' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Observações' })).toBeInTheDocument();
  });
});
