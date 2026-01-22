import { Route, Routes, Navigate } from "react-router-dom";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import DashboardHistory from "@/pages/dashboard/DashboardHistory";
import DashboardAnalytics from "@/pages/dashboard/DashboardAnalytics";
import DashboardSettings from "@/pages/dashboard/DashboardSettings";
import DashboardAnalysisDetail from "@/pages/dashboard/DashboardAnalysisDetail";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="history" element={<DashboardHistory />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="settings" element={<DashboardSettings />} />
          <Route path="analysis/:id" element={<DashboardAnalysisDetail />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
