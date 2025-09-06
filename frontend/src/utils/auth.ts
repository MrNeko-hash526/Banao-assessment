export function checkIsDoctor(user: any) {
  if (!user) return false;

  const type = user.userType || user.role || user.type;
  if (typeof type === 'string' && type.toLowerCase() === 'doctor') return true;

  if (user.isDoctor || user.is_doctor) return true;

  if (Array.isArray(user.roles) && user.roles.some((r: string) => r.toLowerCase() === 'doctor')) {
    return true;
  }

  return false;
}

export function checkIsPatient(user: any) {
  if (!user) return false;
  const type = user.userType || user.role || user.type;
  if (typeof type === 'string' && type.toLowerCase() === 'patient') return true;
  if (user.isPatient || user.is_patient) return true;
  if (Array.isArray(user.roles) && user.roles.some((r: string) => r.toLowerCase() === 'patient')) return true;
  return false;
}

// try to read a user object from the stored JWT token if `user` is not present
export function getUserFromToken(): any | null {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json?.user || json || null;
  } catch (e) {
    return null;
  }
}
