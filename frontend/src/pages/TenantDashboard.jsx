import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  Plus,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  X,
  FileText,
  Video,
} from "lucide-react";
import { clsx } from "clsx";

const TenantDashboard = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    type: "Plumbing",
    priority: "Low",
    description: "",
    anonymous: false,
    photo_url: "",
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get("http://localhost:5000/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/tickets", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      fetchTickets();
      setFormData({
        type: "Maintenance",
        priority: "Low",
        description: "",
        anonymous: false,
        photo_url: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post("http://localhost:5000/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFormData({ ...formData, photo_url: res.data.url });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending Approval":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "Assigned":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "In Progress":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  return (
    <Layout
      title="Tenant Portal"
      role="Tenant"
      onSearch={setSearchQuery}
      onNotification={() => setShowNotifications(true)}
      onSettings={() => setShowSettings(true)}
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Need Help?
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Report a maintenance issue and we'll fix it.
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Report Issue
            </button>
          </div>

          {showForm && (
            <div className="glass-panel p-6 rounded-2xl animate-scale-in">
              <h3 className="text-lg font-semibold text-white mb-6">
                New Ticket
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Issue Type
                  </label>
                  <select
                    className="input-field bg-surface/80"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option>Maintenance</option>
                    <option>Security</option>
                    <option>Housekeeping</option>
                    <option>IT</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Low", "Medium", "Urgent"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, priority: p })
                        }
                        className={clsx(
                          "py-2 rounded-lg text-sm font-medium border transition-all",
                          formData.priority === p
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-surface/50 border-white/5 text-zinc-400 hover:bg-surface"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    className="input-field bg-surface/80 h-24 resize-none"
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div
                  onClick={() => document.getElementById("file-upload").click()}
                  className="border border-dashed border-zinc-700 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-surface/50 transition-all cursor-pointer group relative"
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {uploading ? (
                    <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                  ) : formData.photo_url ? (
                    <div className="relative">
                      <img
                        src={formData.photo_url}
                        alt="Preview"
                        className="h-20 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-xs text-green-400 mt-2">
                        File Uploaded!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5 text-zinc-400 group-hover:text-primary" />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Click to upload photo, video or file
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/30 border border-white/5">
                  <input
                    type="checkbox"
                    id="anon"
                    checked={formData.anonymous}
                    onChange={(e) =>
                      setFormData({ ...formData, anonymous: e.target.checked })
                    }
                    className="rounded bg-surface border-zinc-600 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="anon"
                    className="text-sm text-zinc-300 cursor-pointer select-none"
                  >
                    Submit Anonymously
                  </label>
                </div>

                <button type="submit" className="w-full btn-primary">
                  Submit Ticket
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Recent Activity
            </h2>
            <button className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
              View All <ArrowUpRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket, idx) => (
                <div
                  key={ticket.id}
                  className="glass-card p-5 flex flex-col md:flex-row gap-5 items-start md:items-center group animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-surface-highlight rounded-xl flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                    {ticket.photo_url ? (
                      <img
                        src={ticket.photo_url}
                        alt="Issue"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AlertCircle className="text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {ticket.type}
                      </h3>
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusStyle(ticket.status)
                        )}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-1 mb-2">
                      {ticket.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      <span>ID: #{ticket.id}</span>
                      {ticket.priority === "Urgent" && (
                        <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                  Ticket #1234 status updated to{" "}
                  <span className="text-primary font-bold">In Progress</span>
                </p>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  2 mins ago
                </span>
              </div>
              <div className="p-3 bg-surface/50 rounded-xl border border-white/5">
                <p className="text-sm text-zinc-300">
                  New maintenance schedule available.
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
                <span className="text-zinc-300 text-sm">Dark Mode</span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface/30 rounded-xl">
                <span className="text-zinc-300 text-sm">
                  Email Notifications
                </span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <button className="w-full btn-primary mt-2">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TenantDashboard;
