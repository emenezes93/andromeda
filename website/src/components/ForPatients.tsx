import { useState, useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';

const TABS = ['Treino', 'Dieta', 'Evolução', 'Fotos'] as const;

function PhoneAppDemo() {
  const [activeTab, setActiveTab] = useState<'Treino' | 'Dieta'>('Treino');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      setActiveTab((prev) => (prev === 'Treino' ? 'Dieta' : 'Treino'));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-[280px]">
      <div className="rounded-[2.5rem] border-[3px] border-dark/10 bg-white shadow-2xl shadow-dark/10 overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 py-3 bg-surface-muted shrink-0">
          <span className="text-[11px] font-semibold text-dark">9:41</span>
          <div className="flex gap-1">
            <div className="h-[6px] w-4 rounded-sm bg-dark/20" />
            <div className="h-[6px] w-[6px] rounded-full bg-dark/20" />
          </div>
        </div>

        {/* Sliding content */}
        <div className="relative overflow-hidden min-h-[420px]">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${activeTab === 'Dieta' ? '-100%' : '0'})` }}
          >
            {/* Screen 1: Treino */}
            <div className="w-full shrink-0 p-6 space-y-5">
              <div className="text-center">
                <span className="label-soft text-content-subtle">Nível</span>
                <div className="text-xl font-bold text-primary mt-1">Dedicado</div>
                <div className="mt-3 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                  <div className="h-full w-[64%] rounded-full bg-primary" />
                </div>
                <div className="mt-1.5 label-soft text-content-subtle">320 / 500 XP</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <span className="label-soft text-content-subtle">Streak atual</span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl">🔥</span>
                  <span className="text-2xl font-bold text-dark">7 dias</span>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <span className="label-soft text-content-subtle">Treino de hoje</span>
                <div className="text-sm font-semibold text-dark mt-2">Peito + Tríceps</div>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-primary' : 'bg-surface-muted'}`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 label-soft text-content-subtle">3 de 5 exercícios</div>
              </div>
            </div>

            {/* Screen 2: Dieta */}
            <div className="w-full shrink-0 p-6 space-y-5">
              <div className="text-center">
                <span className="label-soft text-content-subtle">Dieta de hoje</span>
                <div className="text-xl font-bold text-primary mt-1">Plano ativo</div>
                <div className="mt-3 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                  <div className="h-full w-[85%] rounded-full bg-primary" />
                </div>
                <div className="mt-1.5 label-soft text-content-subtle">1.720 / 2.000 kcal</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <span className="label-soft text-content-subtle">Refeições</span>
                <div className="mt-2 space-y-2">
                  {[
                    { meal: 'Café', done: true },
                    { meal: 'Almoço', done: true },
                    { meal: 'Jantar', done: false },
                  ].map(({ meal, done }) => (
                    <div key={meal} className="flex items-center justify-between text-sm">
                      <span className={done ? 'text-dark font-medium' : 'text-content-muted'}>
                        {meal}
                      </span>
                      {done && <span className="text-primary text-xs">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <span className="label-soft text-content-subtle">Macros do dia</span>
                <div className="mt-2 flex gap-1">
                  {[
                    { label: 'P', pct: 42, color: 'bg-primary' },
                    { label: 'C', pct: 48, color: 'bg-accent' },
                    { label: 'G', pct: 35, color: 'bg-primary/70' },
                  ].map((m) => (
                    <div key={m.label} className="flex-1 flex flex-col items-center">
                      <div className="w-full h-1.5 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.color}`}
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                      <span className="label-soft text-content-subtle mt-1">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tabs */}
        <div className="grid grid-cols-4 gap-1 p-3 pt-2 bg-surface-muted/50 border-t border-border">
          {TABS.map((tab) => (
            <div
              key={tab}
              className={`rounded-xl py-2.5 text-center transition-colors duration-300 ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-calm text-primary-dark'
              }`}
            >
              <div className="text-[10px] font-medium">{tab}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BENEFITS = [
  {
    title: 'Questionários pelo celular',
    text: 'Responde de qualquer lugar, sem precisar ir ao consultório.',
  },
  {
    title: 'Gamificação real',
    text: 'XP, streaks, badges e níveis que transformam hábito em conquista.',
  },
  {
    title: 'Tudo em um lugar',
    text: 'Treino, dieta, evolução e fotos de progresso no mesmo portal.',
  },
];

export function ForPatients() {
  const headerRef = useReveal();
  const phoneRef = useReveal(0.1);

  return (
    <section className="section-default overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Phone mockup with Treino / Dieta navigation animation */}
          <div ref={phoneRef} className="reveal-clip flex justify-center order-2 lg:order-1">
            <PhoneAppDemo />
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <div ref={headerRef} className="reveal">
              <span className="label-soft text-primary">Para o paciente</span>
              <h2 className="mt-4 text-display-sm font-bold text-dark">
                Engajamento que gera resultado.
              </h2>
              <p className="mt-6 text-lg text-content-muted leading-relaxed">
                Portal exclusivo onde o paciente acompanha treinos, registra refeições e
                visualiza sua evolução com gamificação que motiva a aderência.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {BENEFITS.map((item, i) => (
                <BenefitItem key={item.title} {...item} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitItem({ title, text, index }: { title: string; text: string; index: number }) {
  const ref = useReveal(0.1);

  return (
    <div ref={ref} style={{ transitionDelay: `${(index + 1) * 0.1}s` }} className="reveal">
      <h3 className="text-[15px] font-semibold text-dark">{title}</h3>
      <p className="mt-1 text-sm text-content-muted">{text}</p>
    </div>
  );
}
