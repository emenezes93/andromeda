import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { PatientFormPage } from './PatientFormPage';

function renderPatientForm() {
  return render(
    <MemoryRouter>
      <PatientFormPage />
    </MemoryRouter>,
  );
}

describe('PatientFormPage', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderPatientForm();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
