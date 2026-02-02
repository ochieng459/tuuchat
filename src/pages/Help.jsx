import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  FileText,
  HelpCircle,
  Ticket,
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle,
  Mail
} from "lucide-react";

export default function Help() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const submitHelp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // 1️⃣ Get the logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      alert("You must be logged in to submit a ticket.");
      return;
    }

    // 2️⃣ Insert ticket into 'help' table
    const { data: ticket, error: ticketError } = await supabase
      .from("help")
      .insert({
        user_id: user.id,
        subject,
        message,
        status: "open"
      })
      .select()
      .single();

    if (ticketError) {
      setLoading(false);
      alert(ticketError.message);
      return;
    }

    // 3️⃣ Insert the first message into 'help_messages'
    const { error: msgError } = await supabase
      .from("help_messages")
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message
        // Removed 'is_from_support' column as it doesn't exist
      });

    setLoading(false);

    if (msgError) {
      alert(msgError.message);
    } else {
      setSubject("");
      setMessage("");
      setSuccess(true);
      
      // Auto-navigate after 2 seconds
      setTimeout(() => {
        navigate(`/ticket/${ticket.id}`);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Help & Support</h1>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/my-tickets")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            My Tickets
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-700/50 rounded-2xl p-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Ticket Created Successfully!</h3>
                <p className="text-green-300 text-sm">
                  Redirecting to your ticket conversation...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              You will be redirected in 2 seconds
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Support Hours */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Support Hours</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monday - Friday</span>
                  <span className="text-white font-medium">24/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Saturday</span>
                  <span className="text-white font-medium">24/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sunday</span>
                  <span className="text-white font-medium">24/7</span>
                </div>
              </div>
            </div>

            {/* Common Issues */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Common Issues</h3>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setSubject("Login Problems")}
                  className="w-full text-left p-3 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl text-gray-300 hover:text-white transition-colors"
                >
                  🔐 Login & Authentication
                </button>
                <button 
                  onClick={() => setSubject("Message Not Sending")}
                  className="w-full text-left p-3 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl text-gray-300 hover:text-white transition-colors"
                >
                  ✉️ Message Delivery Issues
                </button>
                <button 
                  onClick={() => setSubject("Group Chat Problems")}
                  className="w-full text-left p-3 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl text-gray-300 hover:text-white transition-colors"
                >
                  👥 Group Chat Features
                </button>
                <button 
                  onClick={() => setSubject("Account Settings")}
                  className="w-full text-left p-3 bg-gray-900/30 hover:bg-gray-900/50 rounded-xl text-gray-300 hover:text-white transition-colors"
                >
                  ⚙️ Account & Settings
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Security Notice</h3>
              </div>
              <p className="text-sm text-gray-400">
                Never share your password, 2FA codes, or personal information via support tickets.
                Our team will never ask for sensitive information.
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Submit a Support Ticket</h2>
                <p className="text-gray-400">
                  Describe your issue and we'll get back to you as soon as possible
                </p>
              </div>

              <form onSubmit={submitHelp} className="space-y-6">
                {/* Subject Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Subject
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Briefly describe your issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-white group-hover:border-gray-600"
                    />
                    <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400" />
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Detailed Description
                  </label>
                  <div className="relative group">
                    <textarea
                      placeholder="Please provide as much detail as possible about your issue..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-white group-hover:border-gray-600 resize-none h-48"
                    />
                    <Mail className="absolute left-4 top-6 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Include error messages or screenshots if possible</span>
                    <span>{message.length}/5000</span>
                  </div>
                </div>

                {/* Priority & Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    
                    
                  </div>
                  
                </div>

                {/* Note: These dropdowns are for UI only - they don't affect the database */}
                

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                    loading
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Ticket...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Submit Ticket
                      <Send className="w-5 h-5" />
                    </span>
                  )}
                </button>
              </form>

              {/* Contact Info */}
              <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <p className="text-sm text-gray-400">
                  For immediate assistance, email us at{" "}
                  <a href="mailto:support@tuuchat.com" className="text-blue-400 hover:text-blue-300">
                    meallycooperation@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}