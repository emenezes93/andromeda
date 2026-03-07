import { useState, useEffect, useRef } from 'react';
import { listExercises } from '@/api/exercises';
import { track } from '@/lib/analytics';
import type { Exercise } from '@/types';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  arms: 'Braços',
  legs: 'Pernas',
  core: 'Core',
  cardio: 'Cardio',
  other: 'Outro',
};

export interface ExerciseAutocompleteProps {
  value: string;
  onChange: (name: string) => void;
  onSelect: (item: { name: string; muscleGroup: string }) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  disabled?: boolean;
}

const DEBOUNCE_MS = 300;

export function ExerciseAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Nome do exercício (busque ou digite)',
  id = 'exercise-autocomplete',
  label,
  disabled = false,
}: ExerciseAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Exercise[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      listExercises({ search: query.trim(), limit: 10 })
        .then((res) => {
          setOptions(res.data);
          setOpen(true);
        })
        .catch(() => setOptions([]))
        .finally(() => {
          setLoading(false);
          debounceRef.current = null;
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    if (v.trim().length >= 2) setOpen(true);
    else setOptions([]);
  };

  const handleSelect = (exercise: Exercise) => {
    const muscleGroup = MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup;
    onSelect({ name: exercise.name, muscleGroup });
    track({ name: 'exercise_added_from_library', exerciseId: exercise.id });
    setQuery(exercise.name);
    onChange(exercise.name);
    setOpen(false);
    setOptions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-body-sm font-medium text-content-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim().length >= 2 && options.length > 0 && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content placeholder-content-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {open && options.length > 0 && (
        <ul
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-button border border-border bg-surface py-1 shadow-soft"
          role="listbox"
        >
          {options.map((exercise) => (
            <li
              key={exercise.id}
              role="option"
              className="cursor-pointer px-3 py-2 text-body-sm text-content transition-calm hover:bg-primary-subtle hover:text-primary"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(exercise);
              }}
            >
              <span className="font-medium">{exercise.name}</span>
              <span className="ml-2 text-content-muted">
                {MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
