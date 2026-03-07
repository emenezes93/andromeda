/**
 * P1.1 — Input de arquivo para upload de imagem com preview e validação de tamanho/tipo.
 */

import { useRef, useState } from 'react';

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

export interface FileUploadProps {
  /** Nome do campo (para formulário) */
  name?: string;
  /** Tamanho máximo em bytes */
  maxSizeBytes?: number;
  /** Callback quando um arquivo é selecionado ou removido */
  onFileSelect: (file: File | null) => void;
  /** Arquivo atualmente selecionado (para preview/clear) */
  file: File | null;
  /** Label do campo */
  label?: string;
  /** Desabilitado */
  disabled?: boolean;
  /** Id para acessibilidade */
  id?: string;
}

export function FileUpload({
  name = 'file',
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  onFileSelect,
  file,
  label = 'Selecionar imagem',
  disabled = false,
  id = 'file-upload',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) {
      onFileSelect(null);
      return;
    }
    if (!selected.type.startsWith('image/')) {
      setError('Envie apenas imagens (JPEG, PNG ou WebP).');
      return;
    }
    if (selected.size > maxSizeBytes) {
      setError(`Arquivo muito grande. Máximo: ${Math.round(maxSizeBytes / 1024 / 1024)} MB.`);
      return;
    }
    onFileSelect(selected);
  };

  const clear = () => {
    onFileSelect(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-body-sm font-medium text-content-muted">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id={id}
          type="file"
          name={name}
          accept={ACCEPT}
          onChange={handleChange}
          disabled={disabled}
          className="block w-full max-w-xs text-body-sm file:mr-3 file:rounded-button file:border-0 file:bg-primary file:px-4 file:py-2 file:text-body-sm file:font-medium file:text-white file:hover:bg-primary-hover"
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
        />
        {file && (
          <button
            type="button"
            onClick={clear}
            className="rounded-button px-2 py-1 text-body-sm text-content-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Limpar
          </button>
        )}
      </div>
      {file && (
        <p className="text-body-sm text-content-muted">
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}
      {file && file.type.startsWith('image/') && (
        <div className="mt-2 rounded-card border border-border overflow-hidden max-w-xs">
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="h-32 w-full object-cover"
          />
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
