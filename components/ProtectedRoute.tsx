import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
    allowedRoles?: string[];
    requireActiveSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireActiveSubscription }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a61d24]"></div>
            </div>
        );
    }

    if (!user || !profile) {
        let redirectPath = '/login';
        if (location.pathname.startsWith('/admin')) {
            redirectPath = '/admin/login';
        } else if (location.pathname.startsWith('/pdv')) {
            redirectPath = '/pdv/login';
        }
        return <Navigate to={redirectPath} replace state={{ from: location }} />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(profile.role)) {
            // Se tentar acessar sem a role correta, redireciona baseado no perfil
            if (profile.role === 'admin_master' || profile.role === 'admin_op') {
                return <Navigate to="/admin/dashboard" replace />;
            } else if (profile.role === 'affiliate') {
                return <Navigate to="/afiliado/dashboard" replace />;
            } else if (profile.role === 'pdv') {
                return <Navigate to="/pdv/dashboard" replace />;
            } else {
                return <Navigate to="/cliente/compras" replace />;
            }
        }
    }

    if (requireActiveSubscription) {
        if (profile.is_delinquent === true || profile.subscription_status === 'inadimplente') {
            // Redireciona o afiliado inadimplente para a página de checkout para regularização
            return <Navigate to="/checkout" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
