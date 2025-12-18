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
  Calendar,
} from "lucide-react";

const StaffDashboard = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Estimate Modal state
  const [estimateTicketId, setEstimateTicketId] = useState(null);
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");

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

  const handleAccept = async () => {
    if (!estimateTicketId || !timeValue) return;

    let minutes = parseInt(timeValue);
    if (timeUnit === "hours") minutes *= 60;
    if (timeUnit === "days") minutes *= 1440;

    const readableTime = `${timeValue} ${timeUnit}`;

    try {
      await axios.put(
        `http://localhost:5000/tickets/${estimateTicketId}/action`,
        {
          action: "staff_accept",
          estimated_fix_time: readableTime,
          duration_minutes: minutes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTickets();
      showToast("Job accepted successfully", "success");
      setEstimateTicketId(null);
      setTimeValue("");
    } catch (err) {
      console.error(err);
      showToast("Error accepting job", "error");
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      setProofUrl(res.data.url);
      showToast("Proof uploaded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Error uploading file", "error");
    } finally {
      setIsUploading(false);
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
        { action: "staff_submit_work", proof_url: proofUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResolvingId(null);
      setProofUrl("");
      fetchTickets();
      showToast("Work submitted for review", "success");
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
                      onClick={() => setEstimateTicketId(ticket.id)}
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
                    <span>{ticket.estimated_fix_time || "No estimate"}</span>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  {ticket.description}
                </p>

                {resolvingId === ticket.id ? (
                  <div className="bg-surface/50 p-4 rounded-xl border border-white/10 animate-scale-in">
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase">
                      Upload Proof of Work
                    </label>

                    {!proofUrl ? (
                      <div className="border border-dashed border-white/20 rounded-lg p-4 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files[0])
                              handleFileUpload(e.target.files[0]);
                          }}
                        />
                        {isUploading ? (
                          <Loader2 className="animate-spin w-5 h-5 mx-auto text-primary" />
                        ) : (
                          <div className="text-zinc-400 text-xs">
                            <Camera className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
                            Click to upload photo or video
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-lg overflow-hidden border border-white/10 h-32 bg-black flex items-center justify-center">
                          {proofUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ? (
                            <video
                              src={proofUrl}
                              className="w-full h-full object-contain"
                              controls
                            />
                          ) : (
                            <img
                              src={proofUrl}
                              alt="Proof"
                              className="w-full h-full object-contain"
                            />
                          )}
                          <button
                            onClick={() => setProofUrl("")}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Submit for Review
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(ticket.id)}
                    className="w-full bg-surface hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium"
                  >
                    <Camera size={16} />
                    Complete Job
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Estimate Modal */}
      {estimateTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161e33] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">Accept Job</h3>
            <p className="text-zinc-400 text-sm mb-4">
              How long will this take to fix?
            </p>

            <div className="flex gap-3 mb-6">
              <input
                type="number"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="flex-1 bg-surface border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Duration"
                min="1"
              />
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                className="bg-surface border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="minutes">Mins</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEstimateTicketId(null)}
                className="text-zinc-400 hover:text-white text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={!timeValue}
                className="btn-primary text-sm px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StaffDashboard;
