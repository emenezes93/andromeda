import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listUsers, updateUserRole, removeUser } from '@/api/users';
import { getStoredUser } from '@/stores/authStore';
import type { TenantMember } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { SkeletonTable } from '@/components/ui/SkeletonCard';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RoleKey = 'owner' | 'admin' | 'practitioner' | 'viewer';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  practitioner: 'Profissional',
  viewer: 'Visualizador',
};

const ROLE_BADGE_VARIANT: Record<string, 'warning' | 'primary' | 'success' | 'default'> = {
  owner: 'warning',
  admin: 'primary',
  practitioner: 'success',
  viewer: 'default',
};

const EDITABLE_ROLES: RoleKey[] = ['admin', 'practitioner', 'viewer'];

const ROLE_RANK: Record<string, number> = {
  owner: 4,
  admin: 3,
  practitioner: 2,
  viewer: 1,
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Inline role selector for a single row
// ---------------------------------------------------------------------------

interface RoleSelectorProps {
  member: TenantMember;
  onRoleUpdated: (memberId: string, newRole: string) => void;
}

function RoleSelector({ member, onRoleUpdated }: RoleSelectorProps) {
  const toast = useToast();
  const [pendingRole, setPendingRole] = useState<string>(member.role);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newRole: string) => {
    if (newRole === member.role) return;
    setPendingRole(newRole);
    setSaving(true);
    try {
      await updateUserRole(member.id, newRole);
      toast.success(`Papel de ${member.name ?? member.email} alterado para ${ROLE_LABELS[newRole] ?? newRole}.`);
      onRoleUpdated(member.id, newRole);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar papel.');
      setPendingRole(member.role); // revert
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-button border border-border bg-surface px-2 py-1.5 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        value={pendingRole}
        disabled={saving}
        onChange={(e) => void handleChange(e.target.value)}
        aria-label={`Alterar papel de ${member.name ?? member.email}`}
      >
        {EDITABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {saving && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function UsersListPage() {
  const toast = useToast();
  const currentUser = getStoredUser();

  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TenantMember | null>(null);

  const canManage = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    listUsers({ page: 1, limit: 50 })
      .then((res) => setMembers(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar usuários.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleUpdated = useCallback((memberId: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );
  }, []);

  const handleRemoveClick = useCallback((member: TenantMember) => {
    setConfirmRemove(member);
  }, []);

  const handleRemoveConfirm = useCallback(
    async (member: TenantMember) => {
      const displayName = member.name ?? member.email;
      setRemovingId(member.id);
      setConfirmRemove(null);
      try {
        await removeUser(member.id);
        toast.success(`Usuário "${displayName}" removido com sucesso.`);
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao remover usuário.');
      } finally {
        setRemovingId(null);
      }
    },
    [toast],
  );

  // Whether current user may act on a specific target member
  const canActOn = useCallback(
    (member: TenantMember): boolean => {
      if (!canManage) return false;
      if (member.id === currentUser?.id) return false;
      if (member.role === 'owner') return false;
      // admin cannot act on other admins unless current user is owner
      if (member.role === 'admin' && currentUser?.role !== 'owner') return false;
      return true;
    },
    [canManage, currentUser],
  );

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton height={32} width={200} />
          <Skeleton height={40} width={144} />
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-heading font-semibold text-content">Usuários</h1>
          {canManage && (
            <Link to="/users/invite">
              <Button>Convidar usuário</Button>
            </Link>
          )}
        </div>
        <Card className="border-error bg-error-light">
          <p className="text-error">{error}</p>
          <Button className="mt-4" onClick={fetchUsers}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  // Sort: owner first, then by rank descending, then alphabetically
  const sorted = [...members].sort((a, b) => {
    const rankDiff = (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    const nameA = a.name ?? a.email;
    const nameB = b.name ?? b.email;
    return nameA.localeCompare(nameB, 'pt-BR');
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-semibold text-content">Usuários</h1>
          <p className="mt-0.5 text-body-sm text-content-muted">
            {members.length} {members.length === 1 ? 'membro' : 'membros'} neste tenant
          </p>
        </div>
        {canManage && (
          <Link to="/users/invite">
            <Button variant="tactile">Convidar usuário</Button>
          </Link>
        )}
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <Card>
          <p className="text-content-muted">Nenhum usuário encontrado.</p>
          {canManage && (
            <div className="mt-4">
              <Link to="/users/invite">
                <Button variant="outline" size="sm">
                  Convidar o primeiro usuário
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-content-muted">
                    Usuário
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-content-muted">
                    Papel
                  </th>
                  {canManage && (
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-content-muted">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((member) => {
                  const initials = getInitials(member.name, member.email);
                  const badgeVariant =
                    ROLE_BADGE_VARIANT[member.role as RoleKey] ?? 'default';
                  const actable = canActOn(member);
                  const isCurrentUser = member.id === currentUser?.id;
                  const isRemoving = removingId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className={`transition-calm hover:bg-surface-muted/50 ${isRemoving ? 'opacity-50' : ''}`}
                    >
                      {/* Avatar + Name + Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-body-sm font-semibold text-primary"
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-body font-medium text-content">
                              {member.name ?? (
                                <span className="text-content-muted italic">
                                  Sem nome
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="ml-2 text-body-sm text-content-subtle">
                                  (você)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-body-sm text-content-muted">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-5 py-4">
                        <Badge variant={badgeVariant}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </Badge>
                      </td>

                      {/* Actions column — only rendered when current user can manage */}
                      {canManage && (
                        <td className="px-5 py-4">
                          {actable ? (
                            <div className="flex items-center justify-end gap-3">
                              {/* Inline role selector */}
                              <RoleSelector
                                member={member}
                                onRoleUpdated={handleRoleUpdated}
                              />

                              {/* Remove button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error hover:bg-error-light hover:text-error"
                                loading={isRemoving}
                                onClick={() => handleRemoveClick(member)}
                                aria-label={`Remover ${member.name ?? member.email}`}
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            /* Placeholder to keep column consistent */
                            <span />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={confirmRemove !== null}
        title="Remover usuário"
        message={
          confirmRemove
            ? `Tem certeza que deseja remover "${confirmRemove.name ?? confirmRemove.email}" do tenant? Essa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        loading={confirmRemove !== null && removingId === confirmRemove.id}
        onConfirm={() => confirmRemove && void handleRemoveConfirm(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
