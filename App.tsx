
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HomePageTest from './pages/HomePageTest';
import ShopPage from './pages/ShopPage';
import LojaPage from './pages/ShopPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AffiliateReferrals from './pages/AffiliateReferrals';
import AffiliateFinancial from './pages/AffiliateFinancial';
import AffiliateReports from './pages/AffiliateReports';
import AffiliateMaterials from './pages/AffiliateMaterials';
import AffiliateSettings from './pages/AffiliateSettings';
import AffiliateRanking from './pages/AffiliateRanking';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAffiliates from './pages/AdminAffiliates';
import AffiliateLayout from './components/AffiliateLayout';
import AdminLayout from './components/AdminLayout';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminSecurity from './pages/AdminSecurity';
import AdminCommissions from './pages/AdminCommissions';
import AdminCategories from './pages/AdminCategories';
import CheckoutPage from './pages/CheckoutPage';
import AdminFinancial from './pages/AdminFinancial';
import AdminMaterials from './pages/AdminMaterials';
import AdminPdvs from './pages/AdminPdvs';
import ProductDetails from './pages/ProductDetails';
import CheckoutSuccess from './pages/CheckoutSuccess';
import PlanLandingPage from './pages/PlanLandingPage';
import ServiceLandingPage from './pages/ServiceLandingPage';
import ClientDashboard from './pages/ClientDashboard';
import PdvLoginPage from './pages/PdvLoginPage';
import PdvDashboard from './pages/PdvDashboard';

import ProtectedRoute from './components/ProtectedRoute';
import ReferralHandler from './components/ReferralHandler';
import CartDrawer from './components/CartDrawer';
import { useCart } from './components/CartContext';
import { ShoppingBag } from 'lucide-react';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const isDashboard = location.pathname.startsWith('/afiliado') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/cliente') || location.pathname.startsWith('/pdv') || location.pathname === '/home-test';

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboard && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home-test" element={<HomePageTest />} />
          <Route path="/plan/:planSlug" element={<PlanLandingPage />} />
          <Route path="/service/:serviceSlug" element={<ServiceLandingPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/loja" element={<ShopPage />} />
          <Route path="/p/:id" element={<ProductDetails />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success/:orderId" element={<CheckoutSuccess />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/ref/:referralCode" element={<ReferralHandler />} />

          {/* Client Routes */}
          <Route path="/cliente" element={<ProtectedRoute allowedRoles={['client', 'affiliate', 'admin_master']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/cliente/compras" element={<ProtectedRoute allowedRoles={['client', 'affiliate', 'admin_master']}><ClientDashboard /></ProtectedRoute>} />

          {/* PDV / Empório Routes */}
          <Route path="/pdv/login" element={<PdvLoginPage />} />
          <Route path="/pdv/dashboard" element={<ProtectedRoute allowedRoles={['pdv', 'admin_master', 'admin_op']}><PdvDashboard /></ProtectedRoute>} />

          {/* Protected Affiliate Dashboard Routes */}
          <Route path="/afiliado/dashboard" element={<ProtectedRoute allowedRoles={['affiliate']} requireActiveSubscription={true}><AffiliateDashboard /></ProtectedRoute>} />
          <Route path="/afiliado/referrals" element={<ProtectedRoute allowedRoles={['affiliate']} requireActiveSubscription={true}><AffiliateReferrals /></ProtectedRoute>} />
          <Route path="/afiliado/financial" element={<ProtectedRoute allowedRoles={['affiliate']} requireActiveSubscription={true}><AffiliateFinancial /></ProtectedRoute>} />
          <Route path="/afiliado/reports" element={<ProtectedRoute allowedRoles={['affiliate']} requireActiveSubscription={true}><AffiliateReports /></ProtectedRoute>} />
          <Route path="/afiliado/materials" element={<ProtectedRoute allowedRoles={['affiliate']} requireActiveSubscription={true}><AffiliateMaterials /></ProtectedRoute>} />
          <Route path="/afiliado/ranking" element={<ProtectedRoute allowedRoles={['affiliate']} requireActiveSubscription={true}><AffiliateRanking /></ProtectedRoute>} />
          <Route path="/afiliado/settings" element={<ProtectedRoute allowedRoles={['affiliate', 'client']}><AffiliateSettings /></ProtectedRoute>} />

          {/* Fallback para rotas antigas de dashboard */}
          <Route path="/dashboard" element={<Navigate to="/afiliado/dashboard" replace />} />
          <Route path="/dashboard/*" element={<Navigate to="/afiliado/dashboard" replace />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/affiliates" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminAffiliates /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/financial" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminFinancial /></ProtectedRoute>} />
          <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['admin_master']}><AdminSecurity /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminCommissions /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/materials" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminMaterials /></ProtectedRoute>} />
          <Route path="/admin/pdvs" element={<ProtectedRoute allowedRoles={['admin_master', 'admin_op']}><AdminPdvs /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      <CartDrawer />

      {/* Floating Cart Button */}
      {!isDashboard && cartCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#a61d24] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 wine-glow animate-bounce"
          style={{ animationDuration: '3s' }}
          title="Ver Carrinho"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-white text-[#a61d24] text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-[#a61d24] shadow-sm">
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );
};

import { AuthProvider } from './components/AuthContext';
import { CartProvider } from './components/CartContext';

import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <Router>
      <CartProvider>
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <AppContent />
        </AuthProvider>
      </CartProvider>
    </Router>
  );
};

export default App;
