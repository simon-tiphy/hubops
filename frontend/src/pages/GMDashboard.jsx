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
  CartesianGrid,
} from "recharts";
import {
  CheckSquare,
  Activity,
  Users,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  MoreHorizontal,
  X,
  Clock,
  Video,
  FileText,
  CheckCircle,
} from "lucide-react";
import { clsx } from "clsx";
import RecurringTasks from "../components/RecurringTasks";

const GMDashboard = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Pending, Active, Resolved, Rejected
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

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

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === "Pending") return t.status === "Pending Approval";
    if (filterStatus === "Active")
      return t.status === "In Progress" || t.status === "Assigned";
    if (filterStatus === "Resolved") return t.status === "Resolved";
    if (filterStatus === "Rejected") return t.status === "Rejected";
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending Approval":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "Assigned":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "In Progress":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  // Timer logic
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const getTimerContent = (ticket) => {
    if (
      ticket.status === "Resolved" &&
      ticket.resolved_at &&
      ticket.accepted_at
    ) {
      // Show total time taken
      const start = new Date(ticket.accepted_at).getTime();
      const end = new Date(ticket.resolved_at).getTime();
      const diff = end - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return (
        <span className="text-zinc-500 text-xs flex items-center gap-1">
          <Clock size={12} />
          Took {hours}h {minutes}m
        </span>
      );
    }

    if (
      ticket.status === "In Progress" &&
      ticket.accepted_at &&
      ticket.assigned_duration_minutes
    ) {
      const start = new Date(ticket.accepted_at).getTime();
      const durationMs = ticket.assigned_duration_minutes * 60 * 1000;
      const deadline = start + durationMs;
      const diff = deadline - now;

      const isOverdue = diff < 0;
      const absDiff = Math.abs(diff);

      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      return (
        <div
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-bold border",
            isOverdue
              ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          )}
        >
          <Clock size={12} />
          {isOverdue ? "-" : ""}
          {timeString}
        </div>
      );
    }

    return null;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );

  return (
    <Layout
      title="Operations Control"
      role="General Manager"
      onSearch={setSearchQuery}
      onNotification={() => setShowNotifications(true)}
      onSettings={() => setShowSettings(true)}
      notificationCount={tickets.filter((t) => t.status === "Resolved").length}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Pending Triage"
          value={pendingTickets.length}
          change="+2"
          color="text-white"
          onClick={() => setFilterStatus("Pending")}
          active={filterStatus === "Pending"}
        />
        <KPICard
          title="Active Issues"
          value={
            tickets.filter(
              (t) => t.status === "In Progress" || t.status === "Assigned"
            ).length
          }
          change="+5"
          color="text-orange-400"
          onClick={() => setFilterStatus("Active")}
          active={filterStatus === "Active"}
        />
        <KPICard
          title="Resolved Today"
          value={tickets.filter((t) => t.status === "Resolved").length}
          change="+12"
          color="text-emerald-400"
          onClick={() => setFilterStatus("Resolved")}
          active={filterStatus === "Resolved"}
        />
        <KPICard
          title="Avg Fix Time"
          value="3.2h"
          change="-15%"
          color="text-blue-400"
          onClick={() => setFilterStatus("All")}
          active={filterStatus === "All"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Column: Triage */}
        <div className="lg:col-span-2 space-y-8">
          {/* Triage Queue */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {filterStatus === "All" ? (
                  <Activity className="text-primary" size={20} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                )}
                {filterStatus === "All"
                  ? "All Issues"
                  : `${filterStatus} Queue`}
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-surface px-2 py-1 rounded-md border border-white/5">
                {filteredTickets.length} Tickets
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <CheckSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group bg-surface/30 hover:bg-surface/60 border border-white/5 p-4 rounded-xl transition-all flex flex-col gap-4 animate-fade-in"
                  >
                    <div className="flex items-start gap-4">
                      {/* Image Preview - Always show original issue */}
                      <div className="w-16 h-16 bg-surface-highlight rounded-lg border border-white/5 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        {ticket.photo_url ? (
                          <img
                            src={ticket.photo_url}
                            alt="Issue"
                            className="w-full h-full object-cover"
                          />
                        ) : ticket.proof_url ? (
                          ticket.proof_url.match(
                            /\.(mp4|webm|ogg|mov|avi|mkv)$/i
                          ) ? (
                            <Video className="text-emerald-400 w-8 h-8" />
                          ) : (
                            <img
                              src={ticket.proof_url}
                              alt="Proof"
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <AlertTriangle className="text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                            {ticket.type}
                          </h4>
                          <div className="flex items-center gap-2">
                            {getTimerContent(ticket)}
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                getStatusColor(ticket.status)
                              )}
                            >
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />{" "}
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          <span>ID: #{ticket.id}</span>
                          {ticket.priority === "Urgent" && (
                            <span className="text-red-400 font-bold">
                              URGENT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400">
                          Assigned to:
                        </span>
                        <select
                          className="bg-transparent border-none text-xs font-medium text-primary focus:ring-0 p-0 cursor-pointer"
                          value={
                            ticket.assigned_dept_id
                              ? [
                                  "Maintenance",
                                  "Security",
                                  "Housekeeping",
                                  "IT",
                                ][ticket.assigned_dept_id - 1] // Hacky mapping for demo
                              : ""
                          }
                          onChange={(e) =>
                            handleAssign(ticket.id, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select Dept
                          </option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Security">Security</option>
                          <option value="Housekeeping">Housekeeping</option>
                          <option value="IT">IT</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-xs text-zinc-400 hover:text-white transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recurring Maintenance Scheduler */}
          <RecurringTasks />
        </div>

        {/* Right Column: Dept Oversight */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Department Load
            </h3>
            <div className="space-y-6">
              {stats?.dept_load?.map((dept, idx) => (
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
                    {stats?.satisfaction?.map((entry, index) => (
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

      {/* Full Width Analytics Section */}
      <AnalyticsSection stats={stats} />

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#161e33] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button
              onClick={() => setShowNotifications(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-white mb-4">
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-surface/50 rounded-xl border border-white/5">
                <p className="text-sm text-zinc-300">
                  New ticket{" "}
                  <span className="text-primary font-bold">#1024</span> reported
                  by Tenant A.
                </p>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  5 mins ago
                </span>
              </div>
              <div className="p-3 bg-surface/50 rounded-xl border border-white/5">
                <p className="text-sm text-zinc-300">
                  Daily maintenance report is ready.
                </p>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  1 hour ago
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#161e33] border border-white/10 rounded-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-white mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface/30 rounded-xl">
                <span className="text-zinc-300 text-sm">System Status</span>
                <span className="text-emerald-400 text-xs font-bold">
                  OPERATIONAL
                </span>
              </div>
              <button className="w-full btn-primary mt-2">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          getStatusColor={getStatusColor}
        />
      )}
    </Layout>
  );
};

const KPICard = ({ title, value, change, color, onClick, active }) => (
  <div
    onClick={onClick}
    className={clsx(
      "glass-card p-5 cursor-pointer transition-all hover:scale-[1.02]",
      active
        ? "border-primary/50 bg-primary/5 shadow-glow"
        : "hover:border-white/10"
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <p
        className={clsx(
          "text-sm font-medium",
          active ? "text-white" : "text-zinc-400"
        )}
      >
        {title}
      </p>
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

const TicketDetailsModal = ({ ticket, onClose, getStatusColor }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#161e33] border border-white/10 rounded-2xl w-full max-w-2xl p-0 relative animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0F1526]">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              Issue Details{" "}
              <span className="text-zinc-500 text-base font-normal">
                #{ticket.id}
              </span>
            </h2>
            <span className="text-xs text-zinc-400">
              Created on {new Date(ticket.created_at).toLocaleString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex flex-wrap gap-2 mb-2">
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                getStatusColor(ticket.status)
              )}
            >
              {ticket.status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-zinc-800 text-zinc-300 border-zinc-700">
              {ticket.priority} Priority
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-zinc-800 text-zinc-300 border-zinc-700">
              {ticket.type}
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Description
            </h3>
            <div className="p-4 bg-surface/50 rounded-xl border border-white/5 text-zinc-300 whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>
          {/* Time Stats */}
          {ticket.accepted_at && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface/30 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-500 block mb-1">
                  Started At
                </span>
                <p className="text-white font-mono text-sm">
                  {new Date(ticket.accepted_at).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-surface/30 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-500 block mb-1">
                  Duration / Deadline
                </span>
                <p className="text-white font-mono text-sm">
                  {ticket.assigned_duration_minutes
                    ? `${ticket.assigned_duration_minutes} Minutes`
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
          {ticket.photo_url && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Original Issue
              </h3>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                <img
                  src={ticket.photo_url}
                  alt="Issue"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            </div>
          )}
          {ticket.proof_url && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={16} /> Proof of Resolution
              </h3>
              <div className="rounded-xl overflow-hidden border border-emerald-500/20 bg-black flex flex-col items-center justify-center relative">
                {ticket.proof_url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ? (
                  <video
                    src={ticket.proof_url}
                    className="w-full h-auto max-h-[400px]"
                    controls
                    playsInline
                  />
                ) : ticket.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={ticket.proof_url}
                    alt="Resolution Proof"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <FileText
                      size={48}
                      className="text-zinc-500 mb-2 mx-auto"
                    />
                    <p className="text-zinc-400 text-sm">
                      File format not previewable
                    </p>
                  </div>
                )}
                <a
                  href={ticket.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-primary/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                  title="Open in New Tab"
                >
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface/30 rounded-xl border border-white/5">
              <span className="text-xs text-zinc-500 block mb-1">Tenant</span>
              <p className="text-white font-medium">{ticket.tenant_name}</p>
            </div>
            <div className="p-4 bg-surface/30 rounded-xl border border-white/5">
              <span className="text-xs text-zinc-500 block mb-1">
                Assigned Department
              </span>
              <p className="text-white font-medium">
                {ticket.assigned_dept_id
                  ? ["Maintenance", "Security", "Housekeeping", "IT"][
                      ticket.assigned_dept_id - 1
                    ]
                  : "Unassigned"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0F1526]/50 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GMDashboard;

const AnalyticsSection = ({ stats }) => {
  const [issuesChartType, setIssuesChartType] = useState("bar");
  const [timeChartType, setTimeChartType] = useState("area");

  const COLORS = ["#10b981", "#64748b", "#ef4444", "#f59e0b", "#6366f1"];

  const renderIssuesChart = () => {
    switch (issuesChartType) {
      case "line":
        return (
          <LineChart data={stats?.issues_per_dept} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} />
          </LineChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={stats?.issues_per_dept}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="count"
            >
              {stats?.issues_per_dept.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case "bar":
      default:
        return (
          <BarChart data={stats?.issues_per_dept} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60} />
          </BarChart>
        );
    }
  };

  const renderTimeChart = () => {
    switch (timeChartType) {
      case "bar":
        return (
          <BarChart data={stats?.avg_time} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value) => [`${value} hours`, "Avg Time"]}
              labelFormatter={(label, payload) => payload[0]?.payload?.full_date || label}
            />
            <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={60} />
          </BarChart>
        );
      case "pie":
         return (
          <PieChart>
            <Pie
              data={stats?.avg_time}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="hours"
              nameKey="day" // Use day name as label
            >
              {stats?.avg_time.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} hours`, "Avg Time"]} />
          </PieChart>
        );
      case "area":
      default:
        return (
          <AreaChart data={stats?.avg_time} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value) => [`${value} hours`, "Avg Time"]}
              labelFormatter={(label, payload) => payload[0]?.payload?.full_date || label}
            />
            <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
          </AreaChart>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Issues per Department */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-lg font-semibold text-white">Issues per Department</h4>
            <p className="text-sm text-zinc-400">Total tickets raised by category</p>
          </div>
          <div className="flex bg-surface/50 rounded-lg p-1 border border-white/5">
            {["bar", "line", "pie"].map((type) => (
              <button
                key={type}
                onClick={() => setIssuesChartType(type)}
                className={clsx(
                  "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all",
                  issuesChartType === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderIssuesChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Resolution Time */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-lg font-semibold text-white">Average Resolution Time</h4>
            <p className="text-sm text-zinc-400">Time taken to resolve tickets over the last 7 days</p>
          </div>
           <div className="flex bg-surface/50 rounded-lg p-1 border border-white/5">
            {["area", "bar", "pie"].map((type) => (
              <button
                key={type}
                onClick={() => setTimeChartType(type)}
                className={clsx(
                  "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all",
                  timeChartType === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {type === "area" ? "Line/Area" : type}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderTimeChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
