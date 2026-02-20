import { SENTIMENT_SCALE } from '../../constants/sentimentScale.js';

interface SentimentBarProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

/**
 * Barra simples de sentimento: 6 emojis clicáveis (Furioso → Fantástico).
 * Facilita resposta rápida sem digitar.
 */
export function SentimentBar({ value, onChange, ariaLabel = 'Escolha como você se sente' }: SentimentBarProps) {
  return (
    <div className="mt-4" role="group" aria-label={ariaLabel}>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {SENTIMENT_SCALE.map(({ value: optValue, emoji, label }) => {
          const selected = value === optValue;
          return (
            <button
              key={optValue}
              type="button"
              onClick={() => onChange(optValue)}
              aria-pressed={selected}
              aria-label={label}
              title={label}
              className={`
                flex min-h-[52px] min-w-[52px] flex-shrink-0 items-center justify-center rounded-button border-2
                text-3xl transition-calm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                sm:min-h-[60px] sm:min-w-[60px] sm:text-4xl
                ${selected
                  ? 'border-primary bg-primary-subtle'
                  : 'border-border bg-surface hover:border-primary/50 hover:bg-surface-muted'
                }
              `}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
