import { useMemo, useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
  Transition,
} from '@headlessui/react';
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
  const [query, setQuery] = useState('');

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === value) ?? null,
    [patients, value],
  );

  const filteredPatients = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (search.length < 2) return patients.slice(0, 20);
    return patients.filter((p) => p.fullName.toLowerCase().includes(search)).slice(0, 30);
  }, [patients, query]);

  const handleChange = (patient: Patient | null) => {
    onChange(patient?.id ?? '');
  };

  return (
    <div className="relative">
      <Combobox value={selectedPatient} onChange={handleChange} disabled={disabled}>
        <Label
          htmlFor={id}
          className="mb-1.5 block text-body-sm font-medium text-content-muted"
        >
          {label}
        </Label>
        <div className="relative">
          <ComboboxInput
            id={id}
            className="w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            displayValue={(patient: Patient | null) => patient?.fullName ?? ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>

        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ComboboxOptions className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-button border border-border bg-surface py-1 shadow-soft">
            {!value && (
              <ComboboxOption
                value={null}
                className={({ active }) =>
                  `cursor-pointer px-3 py-2 text-body-sm transition-calm ${
                    active ? 'bg-primary-subtle text-primary' : 'text-content-muted'
                  }`
                }
              >
                Nenhum
              </ComboboxOption>
            )}

            {filteredPatients.length === 0 ? (
              <div className="px-3 py-2 text-body-sm text-content-muted">
                {query.trim().length < 2
                  ? 'Digite ao menos 2 caracteres'
                  : 'Nenhum paciente encontrado'}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <ComboboxOption
                  key={patient.id}
                  value={patient}
                  className={({ active, selected }) =>
                    `cursor-pointer px-3 py-2 text-body-sm transition-calm ${
                      active || selected ? 'bg-primary-subtle text-primary' : 'text-content'
                    }`
                  }
                >
                  {patient.fullName}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </Combobox>
    </div>
  );
}
