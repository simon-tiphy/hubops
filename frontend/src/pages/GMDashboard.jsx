import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  CheckSquare,
  Activity,
  Users,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { clsx } from "clsx";

const GMDashboard = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketRes, statsRes] = await Promise.all([
        axios.get("http://localhost:5000/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setTickets(ticketRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (ticketId, deptName) => {
    try {
      await axios.put(
        `http://localhost:5000/tickets/${ticketId}/action`,
        { action: "assign", department: deptName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTickets = tickets.filter((t) => t.status === "Pending Approval");
  const COLORS = ["#10b981", "#64748b", "#ef4444"];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );

  return (
    <Layout title="Operations Control" role="General Manager">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Pending Triage"
          value={pendingTickets.length}
          change="+2"
          color="text-white"
        />
        <KPICard
          title="Active Issues"
          value={tickets.filter((t) => t.status === "In Progress").length}
          change="+5"
          color="text-orange-400"
        />
        <KPICard
          title="Resolved Today"
          value={tickets.filter((t) => t.status === "Resolved").length}
          change="+12"
          color="text-emerald-400"
        />
        <KPICard
          title="Avg Fix Time"
          value="3.2h"
          change="-15%"
          color="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Triage & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Triage Queue */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                Triage Queue
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-surface px-2 py-1 rounded-md border border-white/5">
                {pendingTickets.length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingTickets.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <CheckSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>All caught up!</p>
                </div>
              ) : (
                pendingTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group bg-surface/30 hover:bg-surface/60 border border-white/5 p-4 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-200">
                          {ticket.type}
                        </span>
                        {ticket.priority === "Urgent" && (
                          <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <select
                        className="bg-surface border border-white/10 text-sm rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-40 transition-all hover:border-white/20 cursor-pointer"
                        onChange={(e) =>
                          handleAssign(ticket.id, e.target.value)
                        }
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Assign To...
                        </option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Security">Security</option>
                        <option value="Housekeeping">Housekeeping</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-6">
                Issues per Department
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.issues_per_dept}>
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[4, 4, 4, 4]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-6">
                Avg Time to Fix (Hours)
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.avg_time}>
                    <defs>
                      <linearGradient
                        id="colorHours"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorHours)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dept Oversight */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Department Load
            </h3>
            <div className="space-y-6">
              {stats?.dept_load.map((dept, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-300 font-medium">
                      {dept.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {dept.active_tickets} active
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(dept.active_tickets * 20, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Satisfaction
            </h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.satisfaction}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.satisfaction.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-2xl font-bold text-white">92%</span>
                  <p className="text-xs text-zinc-500">Positive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const KPICard = ({ title, value, change, color }) => (
  <div className="glass-card p-5">
    <div className="flex justify-between items-start mb-4">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <MoreHorizontal size={16} className="text-zinc-600" />
    </div>
    <div className="flex items-end gap-3">
      <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
      <span
        className={clsx(
          "text-xs font-medium mb-1",
          change.includes("+") ? "text-emerald-400" : "text-red-400"
        )}
      >
        {change}
      </span>
    </div>
  </div>
);

export default GMDashboard;
