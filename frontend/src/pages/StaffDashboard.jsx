import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import {
  Clock,
  CheckCircle,
  Camera,
  Loader2,
  MapPin,
  X,
  Check,
} from "lucide-react";

const StaffDashboard = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [proofUrl, setProofUrl] = useState("");

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

  const handleAction = async (ticketId, action) => {
    try {
      await axios.put(
        `http://localhost:5000/tickets/${ticketId}/action`,
        { action: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTickets();
      showToast(
        action === "staff_accept" ? "Job accepted" : "Job rejected",
        "success"
      );
    } catch (err) {
      console.error(err);
      showToast("Error processing request", "error");
    }
  };

  const handleResolve = async (ticketId) => {
    if (!proofUrl) {
      showToast("Please provide a proof URL (mock upload)", "error");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/tickets/${ticketId}/action`,
        { action: "resolve", proof_url: proofUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResolvingId(null);
      setProofUrl("");
      fetchTickets();
      showToast("Ticket resolved successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Error resolving ticket", "error");
    }
  };

  // Filter tickets for this staff member
  const myPendingTickets = tickets.filter(
    (t) => t.assigned_staff_id === user.id && t.staff_status === "Pending"
  );
  const myActiveTickets = tickets.filter(
    (t) =>
      t.assigned_staff_id === user.id &&
      t.staff_status === "Accepted" &&
      t.status !== "Resolved"
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );

  return (
    <Layout title="My Assignments" role="Staff Member">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pending Invites Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-lg font-semibold text-white">
              Pending Invites
            </h2>
            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded-md border border-blue-500/20">
              {myPendingTickets.length}
            </span>
          </div>

          {myPendingTickets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <p className="text-zinc-500 text-sm">No pending invites.</p>
            </div>
          ) : (
            myPendingTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="glass-card p-6 border-l-4 border-l-blue-500 animate-fade-in-up"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 block">
                      New Assignment
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {ticket.type}
                    </h3>
                  </div>
                  {ticket.priority === "Urgent" && (
                    <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-[10px] font-bold border border-red-500/20 animate-pulse">
                      URGENT
                    </span>
                  )}
                </div>

                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <MapPin size={14} />
                    <span>Store 101</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(ticket.id, "staff_reject")}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleAction(ticket.id, "staff_accept")}
                      className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                    >
                      <Check size={16} />
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Active Jobs Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-lg font-semibold text-white">My Active Jobs</h2>
            <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-2 py-1 rounded-md border border-orange-500/20">
              {myActiveTickets.length}
            </span>
          </div>

          {myActiveTickets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
              <p className="text-zinc-500 text-sm">No active jobs.</p>
            </div>
          ) : (
            myActiveTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="glass-card p-6 border-l-4 border-l-orange-500 animate-fade-in-up"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1 block">
                      In Progress
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {ticket.type}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded text-orange-400 text-xs font-medium border border-white/5">
                    <Clock size={14} />
                    <span>{ticket.estimated_fix_time}</span>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  {ticket.description}
                </p>

                {resolvingId === ticket.id ? (
                  <div className="bg-surface/50 p-4 rounded-xl border border-white/10 animate-scale-in">
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase">
                      Proof of Fix (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input-premium py-2 text-sm"
                        placeholder="http://..."
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleResolve(ticket.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(ticket.id)}
                    className="w-full bg-surface hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium"
                  >
                    <Camera size={16} />
                    Mark Resolved
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StaffDashboard;
