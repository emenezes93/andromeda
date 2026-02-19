import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getPlans,
  getSubscription,
  createCheckout,
  createPortal,
} from '@/api/billing';
import type { BillingPlan, SubscriptionInfo } from '@/api/billing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Período de teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
};

export function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<null | string>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([getPlans(), getSubscription()])
      .then(([plansData, subData]) => {
        setPlans(plansData);
        setSub(subData);
      })
      .catch(() => {
        setPlans([]);
        setSub({
          status: null,
          currentPeriodEnd: null,
          planId: null,
          planLabel: 'Plano mensal',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === '1') {
      toast.success('Assinatura ativada com sucesso.');
      fetchData();
    } else if (canceled === '1') {
      toast.success('Checkout cancelado.');
    }
  }, [searchParams, toast, fetchData]);

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

  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  const nextBilling = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-heading font-semibold text-content">Assinatura</h1>
        <p className="mt-1 text-body-sm text-content-muted">
          Escolha o plano e gerencie seu pagamento recorrente.
        </p>
      </div>

      {/* Assinatura atual (quando ativa) */}
      {isActive && sub && (
        <Card className="card-achievements overflow-hidden border-primary/20">
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-heading-sm font-semibold text-content">
                  Sua assinatura: {sub.planLabel}
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
          </div>
        </Card>
      )}

      {/* Lista de planos */}
      {plans.length === 0 ? (
        <Card>
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
              >
                <div className="p-6">
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
                    ) : !isActive ? (
                      <Button
                        variant={hasSavings ? 'tactile' : 'outline'}
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => void handleSubscribe(plan.id)}
                        loading={checkoutLoading === plan.id}
                      >
                        Assinar {plan.interval === 'year' ? 'anual' : 'mensal'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sem assinatura: destaque para assinar */}
      {!isActive && plans.length > 0 && (
        <p className="text-body-sm text-content-subtle">
          Selecione um plano acima para iniciar. Pagamentos processados com segurança pelo Stripe.
          Cancele ou altere a qualquer momento no portal de assinatura.
        </p>
      )}

      {isActive && (
        <p className="text-body-sm text-content-subtle">
          Use &quot;Gerenciar assinatura&quot; para atualizar cartão, trocar de plano ou cancelar.
        </p>
      )}
    </div>
  );
}
