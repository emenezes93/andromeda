import { useState, useRef, useEffect } from 'react';
import type { Patient } from '@/types';

interface PatientSearchSelectProps {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  disabled?: boolean;
}

export function PatientSearchSelect({
  patients,
  value,
  onChange,
  placeholder = 'Buscar por nome...',
  id = 'patient-search',
  label = 'Paciente (opcional)',
  disabled = false,
}: PatientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = patients.find((p) => p.id === value);
  const search = input.trim().toLowerCase();
  const filtered =
    search.length < 2
      ? patients.slice(0, 20)
      : patients.filter((p) => p.fullName.toLowerCase().includes(search)).slice(0, 30);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const displayValue = open ? input : selected ? selected.fullName : '';

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-body-sm font-medium text-content-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        disabled={disabled}
        value={displayValue}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange('');
        }}
        onFocus={() => {
          setOpen(true);
          if (!input && selected) setInput(selected.fullName);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {open && (
        <ul
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-button border border-border bg-surface py-1 shadow-soft"
          role="listbox"
        >
          {!value && (
            <li
              role="option"
              className="cursor-pointer px-3 py-2 text-body-sm text-content-muted hover:bg-surface-muted"
              onClick={() => {
                onChange('');
                setInput('');
                setOpen(false);
              }}
            >
              Nenhum
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-body-sm text-content-muted">
              {search.length < 2 ? 'Digite ao menos 2 caracteres' : 'Nenhum paciente encontrado'}
            </li>
          ) : (
            filtered.map((p) => (
              <li
                key={p.id}
                role="option"
                aria-selected={p.id === value}
                className={`cursor-pointer px-3 py-2 text-body-sm transition-calm hover:bg-surface-muted ${
                  p.id === value ? 'bg-primary-subtle text-primary' : 'text-content'
                }`}
                onClick={() => {
                  onChange(p.id);
                  setInput('');
                  setOpen(false);
                }}
              >
                {p.fullName}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
