import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';

const AdminRoute = ({ children }) => {
  const { user, authLoading } = useAuth();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (!user) {
      setAdminChecked(true);
      setIsAdminUser(false);
      return;
    }
    let cancelled = false;
    isAdmin(user).then((ok) => {
      if (!cancelled) {
        setAdminChecked(true);
        setIsAdminUser(ok);
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || !adminChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">관리자 확인 중...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/profile" replace />;
  }

  if (!isAdminUser) {
    return <Navigate to="/main" replace />;
  }

  return children;
};

export default AdminRoute;
