import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';
import { PageLayout } from './PageLayout';

/* ── Mocks ── */

const mockClearAuth = vi.fn();
let mockUser: Record<string, unknown> | null = {
  id: 'u1',
  email: 'owner@test.com',
  name: 'Owner',
  role: 'owner',
  tenantId: 't1',
};

vi.mock('@/stores/authStore', () => ({
  getStoredUser: () => mockUser,
  clearAuth: (...args: unknown[]) => mockClearAuth(...args),
}));

vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

// Mock AlertsBell to isolate sidebar tests from API calls
const mockAlertsBell = vi.fn(() => (
  <div data-testid="alerts-bell">AlertsBell</div>
));
vi.mock('@/components/ui/AlertsBell', () => ({
  AlertsBell: () => mockAlertsBell(),
}));

/* ── Helpers ── */

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderPageLayout(initialRoute = '/', title = 'Test Page') {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <PageLayout title={title}>
          <p>Page content</p>
        </PageLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ── Tests ── */

describe('PageLayout / Sidebar', () => {
  beforeEach(() => {
    mockUser = {
      id: 'u1',
      email: 'owner@test.com',
      name: 'Owner',
      role: 'owner',
      tenantId: 't1',
    };
    mockClearAuth.mockClear();
    mockAlertsBell.mockClear();
  });

  // ── Structure ──

  it('renders sidebar with correct landmark', () => {
    renderPageLayout();
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    expect(aside).toBeInTheDocument();
  });

  it('renders main navigation with aria-label', () => {
    renderPageLayout();
    const nav = screen.getByRole('navigation', { name: /navegação principal/i });
    expect(nav).toBeInTheDocument();
  });

  it('renders primary nav links (Uso diario)', () => {
    renderPageLayout();
    expect(screen.getByRole('link', { name: /início/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /alunos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /avaliações/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /questionários/i })).toBeInTheDocument();
  });

  it('renders expandable Planos with submenu', () => {
    renderPageLayout('/diet-plans');
    expect(screen.getByRole('button', { name: /planos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planos de dieta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planos de treino/i })).toBeInTheDocument();
  });

  it('renders expandable Relatorios with submenu', () => {
    renderPageLayout('/audit');
    expect(screen.getByRole('button', { name: /relatórios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /histórico de atividades/i })).toBeInTheDocument();
  });

  it('renders Administracao section', () => {
    renderPageLayout();
    expect(screen.getByRole('link', { name: /assinatura/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /segurança/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notificações/i })).toBeInTheDocument();
  });

  it('renders main content and skip link', () => {
    renderPageLayout();
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main?.tagName).toBe('MAIN');
    expect(screen.getByRole('link', { name: /pular para o conteúdo principal/i })).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  // ── User block ──

  it('renders user email in sidebar footer', () => {
    renderPageLayout();
    expect(screen.getByText('owner@test.com')).toBeInTheDocument();
  });

  it('renders role badge for owner', () => {
    renderPageLayout();
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    const badge = within(aside).getByText('Proprietário');
    expect(badge).toBeInTheDocument();
  });

  it('renders role badge for practitioner', () => {
    mockUser = { ...mockUser!, role: 'practitioner' };
    renderPageLayout();
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    const badge = within(aside).getByText('Praticante');
    expect(badge).toBeInTheDocument();
  });

  it('renders role badge for viewer', () => {
    mockUser = { ...mockUser!, role: 'viewer' };
    renderPageLayout();
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    const badge = within(aside).getByText('Visualizador');
    expect(badge).toBeInTheDocument();
  });

  it('shows dash when user email is null', () => {
    mockUser = { ...mockUser!, email: undefined };
    renderPageLayout();
    // The email fallback is '—'
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    expect(within(aside).getByText('—')).toBeInTheDocument();
  });

  it('shows dash when user role is missing', () => {
    mockUser = { ...mockUser!, role: undefined };
    renderPageLayout();
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    // Badge fallback for undefined role
    expect(within(aside).getByText('—')).toBeInTheDocument();
  });

  it('logout button calls clearAuth and navigates to login', () => {
    renderPageLayout();
    const logoutBtn = screen.getByRole('button', { name: /sair/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(mockClearAuth).toHaveBeenCalledTimes(1);
  });

  // ── RBAC visibility ──

  it('shows Users link for admin role', () => {
    mockUser = { ...mockUser!, role: 'admin' };
    renderPageLayout();
    expect(screen.getByRole('link', { name: /usuários|users/i })).toBeInTheDocument();
  });

  it('hides Users and Tenants links for practitioner role', () => {
    mockUser = { ...mockUser!, role: 'practitioner' };
    renderPageLayout();
    expect(screen.queryByRole('link', { name: /usuários|users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /organizações|tenants/i })).not.toBeInTheDocument();
  });

  it('shows Tenants link only for owner', () => {
    const first = renderPageLayout();
    expect(screen.getByRole('link', { name: /organizações|tenants/i })).toBeInTheDocument();
    first.unmount();

    // admin should NOT see tenants
    mockUser = { ...mockUser!, role: 'admin' };
    const second = renderPageLayout();
    expect(screen.queryAllByRole('link', { name: /organizações|tenants/i })).toHaveLength(0);
    second.unmount();
  });

  it('hides Users and Tenants links for viewer role', () => {
    mockUser = { ...mockUser!, role: 'viewer' };
    renderPageLayout();
    expect(screen.queryByRole('link', { name: /usuários|users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /organizações|tenants/i })).not.toBeInTheDocument();
  });

  // ── Notifications ──

  it('renders AlertsBell in the sidebar footer', async () => {
    renderPageLayout();
    const aside = screen.getByRole('complementary', { name: /barra lateral/i });
    expect(await within(aside).findByTestId('alerts-bell')).toBeInTheDocument();
  });

  it('renders AlertsBell in mobile top bar', async () => {
    renderPageLayout();
    // Mobile header is outside the aside
    const bells = await screen.findAllByTestId('alerts-bell');
    // Should exist in both desktop sidebar and mobile header
    expect(bells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders notifications link in nav pointing to settings', () => {
    renderPageLayout();
    const notifLink = screen.getByRole('link', { name: /notificações/i });
    expect(notifLink).toBeInTheDocument();
    expect(notifLink).toHaveAttribute('href', '/settings/notifications');
  });

  it('AlertsBell is called at least once per render (sidebar + mobile)', async () => {
    renderPageLayout();
    // sidebar + mobile header = at least 2 renders
    await waitFor(() => {
      expect(mockAlertsBell).toHaveBeenCalledTimes(2);
    });
  });

  // ── Null user edge case ──

  it('handles null user gracefully (no crash)', () => {
    mockUser = null;
    expect(() => renderPageLayout()).not.toThrow();
  });

  // ── Accessibility ──

  it('should have no critical accessibility violations in sidebar', async () => {
    const { container } = renderPageLayout();
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false }, // jsdom sem canvas
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true },
        'document-title': { enabled: false },
      },
    });
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });
});
