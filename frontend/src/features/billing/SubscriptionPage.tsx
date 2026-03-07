import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlans,
  getSubscription,
  getInvoices,
  createCheckout,
  createPortal,
  changePlan as apiChangePlan,
  cancelSubscription as apiCancelSubscription,
  reactivateSubscription as apiReactivateSubscription,
} from '@/api/billing';
import type { InvoiceItem } from '@/api/billing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { PlanUsageCard } from '@/components/ui/PlanUsageCard';
import { Skeleton } from '@/components/ui/Skeleton';

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Período de teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toLowerCase() === 'brl' ? 'BRL' : currency,
  }).format(amount / 100);
}

export function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<null | string>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: getPlans,
  });

  const { data: sub, isLoading: loadingSub } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: getSubscription,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: getInvoices,
  });

  const changePlanMutation = useMutation({
    mutationFn: apiChangePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      toast.success('Plano alterado com sucesso.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao trocar plano.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: apiCancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      setCancelModalOpen(false);
      toast.success('Assinatura será cancelada ao final do período.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: apiReactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      toast.success('Assinatura mantida.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao reativar.');
    },
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === '1') {
      toast.success('Assinatura ativada com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
    } else if (canceled === '1') {
      toast.success('Checkout cancelado.');
    }
  }, [searchParams, toast, queryClient]);

  const handleSubscribe = async (planId: 'monthly' | 'semiannual' | 'annual') => {
    setCheckoutLoading(planId);
    try {
      const { url } = await createCheckout(planId);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível iniciar o checkout.');
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortal();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir o portal.');
      setPortalLoading(false);
    }
  };

  const loading = loadingPlans || loadingSub;
  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  const nextBilling = sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : null;
  const trialActive =
    sub?.trialEndsAt && new Date(sub.trialEndsAt) > new Date() && !isActive;
  const trialDaysLeft = trialActive && sub?.trialEndsAt
    ? Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;
  const cancelScheduled = isActive && sub?.cancelAtPeriodEnd;
  const cancelAtFormatted = sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '';

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" rounded="lg" />
        <Skeleton className="h-40 w-full" rounded="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-body-sm text-content-muted">
          Escolha o plano e gerencie seu pagamento recorrente.
        </p>
      </div>

      {/* Trial banner */}
      {trialActive && (
        <Card padding="md" className="border-warning bg-warning-subtle">
          <p className="text-body text-warning">
            Seu período de teste termina em {trialDaysLeft} dias. Assine agora para não perder acesso.
          </p>
          <Link to="/subscription" className="mt-3 inline-block">
            <Button variant="primary" size="sm">Assinar agora</Button>
          </Link>
        </Card>
      )}

      {/* Cancelamento agendado */}
      {cancelScheduled && (
        <Card padding="md" className="border-warning bg-warning-subtle">
          <p className="text-body text-warning">
            Sua assinatura será cancelada em {cancelAtFormatted}.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => reactivateMutation.mutate()}
            loading={reactivateMutation.isPending}
          >
            Manter assinatura
          </Button>
        </Card>
      )}

      <PlanUsageCard />

      {/* Plano atual + trocar plano */}
      {isActive && sub && (
        <Card className="overflow-hidden border-primary/20" padding="md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-heading-sm font-semibold text-content">
                Plano atual: {sub.planLabel}
              </h2>
              <p className="mt-1 text-body-sm text-content-muted">
                Status: {STATUS_LABELS[sub.status ?? ''] ?? sub.status}
              </p>
              {nextBilling && (
                <p className="mt-2 text-body-sm text-content-muted">
                  Próxima cobrança: <span className="font-medium text-content">{nextBilling}</span>
                </p>
              )}
              <span className="mt-2 inline-block rounded-full bg-success-light px-2.5 py-1 text-body-sm font-medium text-success">
                Ativa
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => void handleManage()}
              loading={portalLoading}
            >
              Gerenciar assinatura
            </Button>
          </div>
        </Card>
      )}

      {/* Planos com opção de trocar */}
      {plans.length === 0 ? (
        <Card padding="md">
          <p className="text-body text-content-muted">
            Nenhum plano disponível no momento. Configure o billing no servidor ou tente mais tarde.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const isCurrentPlan = isActive && sub?.planId === plan.id;
            const isAnnual = plan.interval === 'year';
            const isSemiannual = plan.id === 'semiannual';
            const hasSavings = isAnnual || isSemiannual;
            return (
              <Card
                key={plan.id}
                className={`overflow-hidden transition-calm ${
                  hasSavings ? 'border-primary/30 ring-1 ring-primary/10' : ''
                } ${isCurrentPlan ? 'opacity-90' : ''}`}
                padding="md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-heading-sm font-semibold text-content">{plan.label}</h3>
                      {hasSavings && (
                        <span className="mt-1 inline-block rounded-full bg-primary-subtle px-2 py-0.5 text-body-sm font-medium text-primary">
                          Economia
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-body-sm text-content-muted">{plan.description}</p>
                  <div className="mt-4">
                    {isCurrentPlan ? (
                      <p className="text-body-sm font-medium text-primary">Plano atual</p>
                    ) : isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => changePlanMutation.mutate(plan.id)}
                        loading={changePlanMutation.isPending}
                      >
                        Trocar plano
                      </Button>
                    ) : (
                      <Button
                        variant={hasSavings ? 'tactile' : 'outline'}
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => void handleSubscribe(plan.id)}
                        loading={checkoutLoading === plan.id}
                      >
                        Assinar {plan.interval === 'year' ? 'anual' : 'mensal'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Faturas */}
      <Card padding="md">
        <h2 className="text-heading-sm font-semibold text-content">Faturas</h2>
        {loadingInvoices ? (
          <Skeleton className="mt-3 h-24 w-full" rounded="md" />
        ) : invoices.length === 0 ? (
          <p className="mt-3 text-body-sm text-content-muted">Nenhuma fatura encontrada.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border-muted text-left text-content-muted">
                  <th className="pb-2 pr-4">Data</th>
                  <th className="pb-2 pr-4">Valor</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: InvoiceItem) => (
                  <tr key={inv.id} className="border-b border-border-muted">
                    <td className="py-2 pr-4">{formatDate(inv.date)}</td>
                    <td className="py-2 pr-4">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="py-2 pr-4">{inv.status}</td>
                    <td className="py-2">
                      {inv.hostedInvoiceUrl && (
                        <a
                          href={inv.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver fatura
                        </a>
                      )}
                      {inv.pdfUrl && (
                        <>
                          {' · '}
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            PDF
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancelar assinatura */}
      {isActive && !cancelScheduled && (
        <Card padding="md">
          <h2 className="text-heading-sm font-semibold text-content">Cancelar assinatura</h2>
          <p className="mt-1 text-body-sm text-content-muted">
            Você terá acesso até {cancelAtFormatted}. Tem certeza?
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setCancelModalOpen(true)}
          >
            Cancelar assinatura
          </Button>
        </Card>
      )}

      <ConfirmModal
        open={cancelModalOpen}
        title="Cancelar assinatura"
        message={`Sua assinatura será cancelada ao final do período atual (${cancelAtFormatted}). Você manterá acesso até essa data. Deseja continuar?`}
        confirmLabel="Sim, cancelar"
        cancelLabel="Não"
        variant="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
}
