import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

export type LottieAnimationData = object;

interface LottieAnimationProps {
  animationData?: LottieAnimationData | null;
  src?: string | null;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function LottieAnimation({
  animationData: dataProp,
  src,
  loop = true,
  autoplay = true,
  className = '',
  style,
}: LottieAnimationProps) {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(dataProp ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (dataProp) {
      setAnimationData(dataProp);
      setLoadError(null);
      return;
    }
    if (!src) {
      setAnimationData(null);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    fetch(src)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json) => {
        if (!cancelled) setAnimationData(json);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Falha ao carregar');
      });
    return () => {
      cancelled = true;
    };
  }, [dataProp, src]);

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center rounded-card bg-surface-muted text-content-muted ${className}`}
        style={{ minHeight: 120, ...style }}
        role="img"
        aria-label="Animação indisponível"
      >
        <span className="text-body-sm">{loadError}</span>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div
        className={`flex items-center justify-center rounded-card bg-surface-muted ${className}`}
        style={{ minHeight: 120, ...style }}
        aria-busy="true"
      >
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  );
}
