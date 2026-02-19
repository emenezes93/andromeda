import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { LoginPage } from './LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('renders title and tagline', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /anamnese inteligente/i })).toBeInTheDocument();
    expect(screen.getByText(/questionários adaptativos e insights em saúde/i)).toBeInTheDocument();
  });

  it('renders login form with email and password', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows demo hint', () => {
    renderLogin();
    expect(screen.getByText(/owner@demo\.com \/ owner123/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderLogin();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
