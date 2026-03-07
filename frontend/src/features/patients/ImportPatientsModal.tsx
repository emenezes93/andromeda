import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { importPatientsCSV, type ImportPatientsResult } from '@/api/patients';
import { track } from '@/lib/analytics';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? '';
    });
    return obj;
  });
}

export function ImportPatientsModal({ open, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportPatientsResult | null>(null);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error('Arquivo CSV vazio ou inválido.');
        return;
      }
      const res = await importPatientsCSV(rows);
      setResult(res);
      if (res.imported > 0) {
        track({ name: 'patients_imported', count: res.imported });
        toast.success(`${res.imported} paciente(s) importado(s) com sucesso.`);
        onSuccess();
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} linha(s) com erro.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }, [file, toast, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-card">
        <h2 className="text-heading-md font-semibold text-content">
          Importar Pacientes via CSV
        </h2>
        <p className="mt-2 text-body-sm text-content-muted">
          Colunas aceitas:{' '}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-body-xs">
            nome, email, telefone, cpf, data_nascimento, sexo, profissao, objetivo, observacoes
          </code>
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
            className="block w-full text-body-sm text-content file:mr-3 file:rounded-button file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-white"
          />
        </div>

        {result && (
          <div className="mt-4 rounded-card border border-border p-3 text-body-sm">
            <p className="text-content">
              Total: {result.total} | Importados:{' '}
              <span className="font-medium text-success">{result.imported}</span> | Erros:{' '}
              <span className="font-medium text-error">{result.failed}</span>
            </p>
            {result.results.filter((r) => r.status === 'error').length > 0 && (
              <ul className="mt-2 max-h-32 space-y-1 overflow-auto">
                {result.results
                  .filter((r) => r.status === 'error')
                  .map((r) => (
                    <li key={r.row} className="text-error">
                      Linha {r.row}: {r.error}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleImport} loading={loading} disabled={!file || loading}>
            Importar
          </Button>
        </div>
      </div>
    </div>
  );
}
