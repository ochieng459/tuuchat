import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  ArrowLeft,
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  FileText,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  User,
  Mail
} from "lucide-react";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, open, in_progress, resolved
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("help")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const refreshTickets = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const statusConfig = (status) => {
    switch (status) {
      case "open":
        return {
          color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Open"
        };
      case "in_progress":
        return {
          color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
          icon: <RefreshCw className="w-4 h-4" />,
          label: "In Progress"
        };
      case "resolved":
        return {
          color: "bg-green-500/20 text-green-300 border-green-500/30",
          icon: <CheckCircle className="w-4 h-4" />,
          label: "Resolved"
        };
      default:
        return {
          color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
          icon: <FileText className="w-4 h-4" />,
          label: "Unknown"
        };
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Apply status filter
    if (filter !== "all" && ticket.status !== filter) return false;
    
    // Apply search filter
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.message.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getStatusCounts = () => {
    const counts = { open: 0, in_progress: 0, resolved: 0, total: tickets.length };
    tickets.forEach(ticket => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">My Support Tickets</h1>
                  <p className="text-xs text-gray-400">Track and manage your support requests</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/help")}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              New Ticket
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-lg font-bold text-white">{statusCounts.total}</span>
              </div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-400">Open</span>
                <span className="text-lg font-bold text-yellow-300">{statusCounts.open}</span>
              </div>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-400">In Progress</span>
                <span className="text-lg font-bold text-blue-300">{statusCounts.in_progress}</span>
              </div>
            </div>
            <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-400">Resolved</span>
                <span className="text-lg font-bold text-green-300">{statusCounts.resolved}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets by subject or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={refreshTickets}
                disabled={refreshing}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              All ({statusCounts.total})
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "open"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Open ({statusCounts.open})
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "in_progress"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              In Progress ({statusCounts.in_progress})
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "resolved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Resolved ({statusCounts.resolved})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-300">Loading your tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-600">
              <Ticket className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {search || filter !== "all" ? "No tickets found" : "No tickets yet"}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {search || filter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Submit your first support ticket and we'll help you right away"
              }
            </p>
            <button
              onClick={() => navigate("/help")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
            >
              <MessageSquare className="w-5 h-5" />
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-2">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </div>
            
            {filteredTickets.map((ticket) => {
              const status = statusConfig(ticket.status);
              const isUpdated = ticket.updated_at !== ticket.created_at;
              
              return (
                <div
                  key={ticket.id}
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 hover:border-blue-500/30 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/ticket/${ticket.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                            {ticket.subject}
                          </h3>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                          {ticket.message}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${status.color} text-xs font-medium`}>
                          {status.icon}
                          {status.label}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {isUpdated && (
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-gray-500">Ticket ID:</span>
                        <code className="text-xs bg-gray-900 px-2 py-1 rounded">
                          #{ticket.id.slice(0, 8)}
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        {!loading && tickets.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Need More Help?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/help")}
                  className="p-4 bg-gray-900/50 hover:bg-gray-900 rounded-xl border border-gray-700 hover:border-blue-500/30 transition-all flex items-center gap-3"
                >
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium text-white">Submit New Ticket</div>
                    <div className="text-sm text-gray-400">Create a new support request</div>
                  </div>
                </button>
                <button
                  onClick={() => alert("Coming soon!")}
                  className="p-4 bg-gray-900/50 hover:bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500/30 transition-all flex items-center gap-3"
                >
                  <Mail className="w-5 h-5 text-purple-400" />
                  <div className="text-left">
                    <div className="font-medium text-white">Email Support</div>
                    <div className="text-sm text-gray-400">support@tuuchat.com</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}