import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import InstructionsPage from '@/pages/InstructionsPage';
import TransactionEntryPage from '@/pages/TransactionEntryPage';
import DataTablePage from '@/pages/DataTablePage';
import DashboardPage from '@/pages/DashboardPage';
import CashFlowPage from '@/pages/CashFlowPage';
import ReconciliationPage from '@/pages/ReconciliationPage';
import CatalogPage from '@/pages/CatalogPage';
import AnalysisPage from '@/pages/AnalysisPage';
import RecurringPage from '@/pages/RecurringPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route - Login */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected routes with AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/instrucciones" element={<InstructionsPage />} />
            <Route path="/ingreso" element={<TransactionEntryPage />} />
            <Route path="/datos" element={<DataTablePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/flujo-caja" element={<CashFlowPage />} />
            <Route path="/caja-bancos" element={<ReconciliationPage />} />
            <Route path="/catalogos" element={<CatalogPage />} />
            <Route path="/analisis" element={<AnalysisPage />} />
            <Route path="/pagos-recurrentes" element={<RecurringPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
