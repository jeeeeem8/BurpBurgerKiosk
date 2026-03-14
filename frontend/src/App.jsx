import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import { SkeletonPage } from './components/Skeleton.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const OrdersHistory = lazy(() => import('./pages/OrdersHistory.jsx'));
const TotalSales = lazy(() => import('./pages/TotalSales.jsx'));
const MenuManagement = lazy(() => import('./pages/MenuManagement.jsx'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));

const ProtectedLayout = () => {
  const isAuthenticated = Boolean(localStorage.getItem('kioskToken'));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />
    </div>
  );
};

const App = () => {
  return (
    <Suspense fallback={<SkeletonPage />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders-history" element={<OrdersHistory />} />
        <Route path="total-sales" element={<TotalSales />} />
        <Route path="menu-management" element={<MenuManagement />} />
        <Route path="inventory" element={<InventoryManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default App;
