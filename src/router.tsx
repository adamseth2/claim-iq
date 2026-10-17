import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './ui/AppLayout';
import { DashboardScreen } from './screens/DashboardScreen';
import { InvestigationScreen } from './screens/InvestigationScreen';
import { CallbackScreen } from './screens/CallbackScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/audit" replace /> },
      { path: 'audit', element: <DashboardScreen /> },
      { path: 'audit/SIG-2026-009', element: <InvestigationScreen /> },
    ],
  },
  { path: '/callback', element: <CallbackScreen /> },
]);
