import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { API_BASE_URL } from "../../config";
import { StoreContext } from "../../context/StoreContext";
import "./AdminAnalytics.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
);

const AdminAnalytics = () => {
  const { token } = useContext(StoreContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/order/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (error) {
      console.error("Analytics Fetch Error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (!analytics) return <p>No analytics data available.</p>;

  // Utility
  const safe = (x) => x || [];

  // -------------------------------------------------------------------------
  // 1️⃣ WEEKLY REVENUE TREND
  // -------------------------------------------------------------------------
  const weeklyRevenueChart = {
    labels: safe(analytics.weekly).map((d) => d._id),
    datasets: [
      {
        label: "Revenue",
        data: safe(analytics.weekly).map((d) => d.revenue),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.3)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  // -------------------------------------------------------------------------
  // 2️⃣ PEAK HOURS (BAR)
  // -------------------------------------------------------------------------
  const hourlyChart = {
    labels: safe(analytics.hourly).map((d) => `${d._id.hour}:00`),
    datasets: [
      {
        label: "Orders",
        data: safe(analytics.hourly).map((d) => d.count),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  // -------------------------------------------------------------------------
  // 3️⃣ CATEGORY SALES (PIE)
  // -------------------------------------------------------------------------
  const categoryChart = {
    labels: safe(analytics.categorySales).map((c) => c._id),
    datasets: [
      {
        data: safe(analytics.categorySales).map((c) => c.count),
        backgroundColor: ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"],
      },
    ],
  };

  // -------------------------------------------------------------------------
  // 4️⃣ TOP ITEMS (BAR)
  // -------------------------------------------------------------------------
  const topItemsChart = {
    labels: safe(analytics.topItems).map((i) => i.foodDetails.name),
    datasets: [
      {
        label: "Units Sold",
        data: safe(analytics.topItems).map((i) => i.totalSold),
        backgroundColor: "#a855f7",
      },
    ],
  };

  // -------------------------------------------------------------------------
  // 5️⃣ CUSTOMER INSIGHTS
  // -------------------------------------------------------------------------
  const customerChart = {
    labels: ["New Customers", "Returning Customers"],
    datasets: [
      {
        data: [analytics.newCustomers || 0, analytics.returningCustomers || 0],
        backgroundColor: ["#22c55e", "#f97316"],
      },
    ],
  };

  // -------------------------------------------------------------------------
  // 6️⃣ ORDER FUNNEL
  // -------------------------------------------------------------------------
  const funnelChart = {
    labels: safe(analytics.funnel).map((f) => f._id),
    datasets: [
      {
        label: "Orders",
        data: safe(analytics.funnel).map((f) => f.count),
        backgroundColor: "#6366f1",
      },
    ],
  };

  return (
    <div className="analytics-container">
      <h2>📊 Analytics Dashboard</h2>

      {/* SUMMARY CARDS */}
      <div className="analytics-grid">
        <div className="card">
          <h3>Total Revenue</h3>
          <p>₹{safe(analytics.weekly).reduce((a, b) => a + b.revenue, 0)}</p>
        </div>

        <div className="card">
          <h3>Total Orders</h3>
          <p>{analytics.hourly.reduce((a, b) => a + b.count, 0)}</p>
        </div>

        <div className="card">
          <h3>Top Item</h3>
          <p>{analytics.topItems[0]?.foodDetails?.name || "N/A"}</p>
        </div>
      </div>

      {/* CHARTS START */}
      <div className="chart-section">
        <h3>📆 Weekly Revenue Trend</h3>
        <Line data={weeklyRevenueChart} />
      </div>

      <div className="chart-section">
        <h3>⏰ Peak Hours (Order Frequency)</h3>
        <Bar data={hourlyChart} />
      </div>

      <div className="chart-section">
        <h3>🍔 Category Sales</h3>
        <Doughnut data={categoryChart} />
      </div>

      <div className="chart-section">
        <h3>🏆 Top Selling Items</h3>
        <Bar data={topItemsChart} />
      </div>

      <div className="chart-section">
        <h3>👥 Customer Insights</h3>
        <Doughnut data={customerChart} />
      </div>

      <div className="chart-section">
        <h3>🔄 Order Funnel</h3>
        <Bar data={funnelChart} />
      </div>
    </div>
  );
};

export default AdminAnalytics;
