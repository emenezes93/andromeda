import { useState, useEffect } from 'react';

interface BreathworkCircleProps {
  /** Duração da inspiração em segundos */
  inhaleSeconds?: number;
  /** Duração da expiração em segundos */
  exhaleSeconds?: number;
  /** Tamanho máximo do círculo (px) */
  size?: number;
  className?: string;
  /** Mostrar label "Inspire" / "Expire" */
  showLabel?: boolean;
}

/**
 * Círculo que expande e contrai suavemente (efeito breathwork) para
 * induzir calma em seções de bem-estar mental.
 */
export function BreathworkCircle({
  inhaleSeconds = 4,
  exhaleSeconds = 4,
  size = 160,
  className = '',
  showLabel = true,
}: BreathworkCircleProps) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [label, setLabel] = useState('Inspire');

  useEffect(() => {
    const cycleMs = (inhaleSeconds + exhaleSeconds) * 1000;
    const t1 = setTimeout(() => {
      setPhase('out');
      setLabel('Expire');
    }, inhaleSeconds * 1000);
    const interval = setInterval(() => {
      setPhase((p) => (p === 'in' ? 'out' : 'in'));
      setLabel((l) => (l === 'Inspire' ? 'Expire' : 'Inspire'));
    }, cycleMs);
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [inhaleSeconds, exhaleSeconds]);

  const duration = phase === 'in' ? inhaleSeconds : exhaleSeconds;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="img"
      aria-label={`Respiração: ${label.toLowerCase()}`}
    >
      <div
        key={phase}
        className="rounded-full bg-primary/20"
        style={{
          width: size,
          height: size,
          animation: `${phase === 'in' ? 'breath-in' : 'breath-out'} ${duration}s ease-in-out forwards`,
        }}
      />
      {showLabel && (
        <p className="text-body font-medium text-content-muted motion-reduce:animate-none">
          {label}
        </p>
      )}
    </div>
  );
}
