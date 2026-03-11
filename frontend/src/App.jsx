import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import InventoryManagement from './pages/InventoryManagement.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import MenuManagement from './pages/MenuManagement.jsx';
import OrdersHistory from './pages/OrdersHistory.jsx';
import TotalSales from './pages/TotalSales.jsx';

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
  );
};

export default App;
