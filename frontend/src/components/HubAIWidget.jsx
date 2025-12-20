import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  PieChart,
  AlertCircle,
  TrendingUp,
  LayoutGrid,
  Search,
  Maximize2,
  Terminal,
} from "lucide-react";

const HubAIWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm HubAI. I can analyze operations data for you. Try asking 'How many open tickets?'",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: userMsg.text }),
      });

      const data = await res.json();

      // Simulate "thinking" time for effect
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.answer },
        ]);
        setIsTyping(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I'm having trouble connecting to the neural network.",
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // Professional Command Grid Categories
  const commandCategories = [
    {
      title: "Market Intelligence",
      icon: <TrendingUp className="text-blue-400" size={16} />,
      commands: ["Recent Activity", "Tenant Satisfaction", "Department Load"],
    },
    {
      title: "Operations Search",
      icon: <Search className="text-purple-400" size={16} />,
      commands: [
        "Find tickets about 'Leak'",
        "Search for 'Noise'",
        "Show ticket #1",
      ],
    },
    {
      title: "Quick Status",
      icon: <LayoutGrid className="text-emerald-400" size={16} />,
      commands: ["How many open tickets?", "Active Issues", "System Summary"],
    },
  ];

  const handleQuickQuestion = (text) => {
    setQuery(text);
    // Optional: auto-send
    // handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto bg-[#0F1526]/95 backdrop-blur-xl border border-white/10 rounded-2xl w-96 shadow-2xl overflow-hidden mb-4 flex flex-col"
            style={{ height: "600px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    HubAI Analyst
                  </h3>
                  <p className="text-xs text-white/50">
                    Simulated Intelligence
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Response Area (Top) */}
            <div className="bg-black/20 p-4 min-h-[140px] max-h-[200px] overflow-y-auto border-b border-white/5 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {messages.length > 1 ? (
                  <motion.div
                    key={messages.length}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-surface/50 p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal size={12} className="text-blue-400" />
                      <span className="text-xs text-blue-300 font-mono">
                        HubAI Output
                      </span>
                    </div>
                    <div className="text-sm text-zinc-100 leading-relaxed">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: messages[messages.length - 1].text
                            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Sparkles className="text-blue-500/50 mb-2" size={24} />
                    <p className="text-sm text-blue-200">System Ready.</p>
                    <p className="text-xs text-blue-300/50">
                      Select a command below to analyze data.
                    </p>
                  </div>
                )}
              </AnimatePresence>
              {isTyping && (
                <div className="mt-2 flex gap-1 justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-1 h-1 bg-white/50 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-1 h-1 bg-white/50 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-1 h-1 bg-white/50 rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Command Grid (Persistent) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gradient-to-b from-[#0F1526] to-[#161e33] space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Available Commands
                </span>
                <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded">
                  Live DB Connection
                </span>
              </div>

              <div className="space-y-4">
                {commandCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="animate-slide-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-blue-400/80 font-bold mb-2 flex items-center gap-2">
                      {cat.icon} {cat.title}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {cat.commands.map((cmd, cmdIdx) => (
                        <button
                          key={cmdIdx}
                          onClick={() => handleQuickQuestion(cmd)}
                          className="text-left px-3 py-2.5 rounded-lg bg-surface/40 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 text-xs text-zinc-300 hover:text-white transition-all group flex justify-between items-center"
                        >
                          {cmd}
                          <span className="opacity-0 group-hover:opacity-100 text-blue-400 -translate-x-2 group-hover:translate-x-0 transition-all">
                            <Send size={10} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about operations..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50"
                  disabled={!query.trim()}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 shadow-lg shadow-blue-600/30 border border-white/20 flex items-center justify-center text-white relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
    </div>
  );
};

export default HubAIWidget;
