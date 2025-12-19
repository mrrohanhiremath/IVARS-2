
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ReportAccident from "../pages/report/page";
import Dashboard from "../pages/dashboard/page";
import Analytics from "../pages/analytics/page";
import MyReports from "../pages/my-reports/page";
import ProtectedRoute from "../components/base/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/report",
    element: <ReportAccident />,
  },
  {
    path: "/my-reports",
    element: (
      <ProtectedRoute allowedRoles={['citizen', 'responder', 'admin']}>
        <MyReports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={['responder', 'admin']}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/analytics",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Analytics />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
