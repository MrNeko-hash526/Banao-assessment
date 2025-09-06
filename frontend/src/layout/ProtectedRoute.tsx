import { Navigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  allowedRole?: 'doctor' | 'patient' | 'any';
};

function checkIsRole(user: any, role?: string) {
  if (!user) return false;
  if (!role || role === 'any') return true;
  const r = user.role || user.type || (user.userType) || undefined;
  if (r && typeof r === 'string' && r.toLowerCase() === role) return true;
  if (role === 'doctor' && (user.isDoctor || user.is_doctor || (Array.isArray(user.roles) && user.roles.includes('doctor')))) return true;
  if (role === 'patient' && (user.isPatient || user.is_patient || (Array.isArray(user.roles) && user.roles.includes('patient')))) return true;
  return false;
}

export default function ProtectedRoute({ children, allowedRole = 'any' }: Props) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = raw ? JSON.parse(raw) : null;

  if (!token) return <Navigate to="/login" replace />;
  if (!checkIsRole(user, allowedRole)) {
    // redirect to home (patient dashboard) if role mismatch
    return <Navigate to="/" replace />;
  }
  return children;
}
