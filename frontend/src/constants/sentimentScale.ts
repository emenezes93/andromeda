/**
 * Escala de sentimento para perguntas tipo "sentiment" nos formulários de anamnese.
 * Ordem: do pior (esquerda) ao melhor (direita), alinhado ao exemplo "Sentimento do público".
 */
export const SENTIMENT_SCALE = [
  { value: 'Furioso(a)', emoji: '😡', label: 'Furioso(a)' },
  { value: 'Péssimo(a)', emoji: '😟', label: 'Péssimo(a)' },
  { value: 'Indiferente', emoji: '😐', label: 'Indiferente' },
  { value: 'Bem', emoji: '🙂', label: 'Bem' },
  { value: 'Ótimo(a)', emoji: '😊', label: 'Ótimo(a)' },
  { value: 'Fantástico(a)', emoji: '😎', label: 'Fantástico(a)' },
] as const;

export type SentimentValue = (typeof SENTIMENT_SCALE)[number]['value'];
