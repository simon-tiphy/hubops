import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Building2, UserCog, Wrench, ArrowRight } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role, dept = null) => {
    const success = await login(role, dept);
    if (success) {
      if (role === "tenant") navigate("/tenant");
      else if (role === "gm") navigate("/gm");
      else if (role === "dept") navigate("/dept");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse delay-1000" />

      <div className="glass-panel p-10 max-w-md w-full rounded-3xl relative z-10 animate-fade-in-up border border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-4 shadow-glow">
            <Building2 className="text-white w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            HubOps
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Enterprise Facility Management
          </p>
        </div>

        <div className="space-y-4">
          <RoleButton
            icon={<Building2 className="w-5 h-5" />}
            title="Tenant Portal"
            desc="Report issues & track requests"
            onClick={() => handleLogin("tenant")}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />

          <RoleButton
            icon={<UserCog className="w-5 h-5" />}
            title="General Manager"
            desc="Operations oversight & analytics"
            onClick={() => handleLogin("gm")}
            color="text-purple-400"
            bg="bg-purple-500/10"
          />

          <RoleButton
            icon={<Wrench className="w-5 h-5" />}
            title="Department Head"
            desc="Task management & resolution"
            onClick={() => handleLogin("dept", "Maintenance")}
            color="text-orange-400"
            bg="bg-orange-500/10"
          />
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-zinc-500 font-medium">
            Protected System • Authorized Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

const RoleButton = ({ icon, title, desc, onClick, color, bg }) => (
  <button
    onClick={onClick}
    className="w-full group relative p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 flex items-center gap-4 hover:border-white/10 hover:shadow-lg active:scale-[0.98]"
  >
    <div
      className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}
    >
      {icon}
    </div>
    <div className="text-left flex-1">
      <h3 className="font-semibold text-zinc-200 text-sm group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
        {desc}
      </p>
    </div>
    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
  </button>
);

export default Login;
