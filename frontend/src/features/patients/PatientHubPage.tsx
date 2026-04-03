import { Navigate, useParams } from 'react-router-dom';

export function PatientHubPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/patients" replace />;
  }

  return <Navigate to={`/patients/${id}`} replace />;
}
