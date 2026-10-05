import { useEffect, useState } from "react";
import {
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function EcommerceMetrics() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
      console.warn("No access token found in sessionStorage");
      return;
    }

    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE}/foliomax/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Stats fetch failed:", err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      
      {/* Excel Files */}
      <MetricCard
        title="Total Excel Files"
        value={stats?.media?.excelFiles}
        icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        badgeColor="success"
      />
    

      {/* Word Files */}
      <MetricCard
        title="Total Word Files"
        value={stats?.media?.wordFiles}
        icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
        badgeColor="primary"
      />

      {/* PDFs */}
      <MetricCard
        title="Total PDFs"
        value={stats?.media?.pdfs}
        icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
        badgeColor="warning"
      />

      {/* Paid PDFs */}
      <MetricCard
        title="Paid PDFs"
        value={stats?.media?.paidPdfs}
        icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
        badgeColor="error"
      />

      {/* Videos */}
      <MetricCard
        title="Total Videos"
        value={stats?.media?.videos}
        icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        badgeColor="success"
      />

    </div>
  );
}

/* 🔥 Reusable Card (UI SAME, just abstracted) */
function MetricCard({
  title,
  value,
  icon,
  badgeColor,
}: {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  badgeColor: "success" | "primary" | "warning" | "error";
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        {icon}
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value !== undefined ? value : "Loading..."}
          </h4>
        </div>

        <Badge color={badgeColor}>
          <ArrowUpIcon />
          +0%
        </Badge>
      </div>
    </div>
  );
}