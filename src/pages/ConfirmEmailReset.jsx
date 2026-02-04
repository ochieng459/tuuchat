// src/pages/ConfirmEmailReset.jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, ArrowRight } from "lucide-react";

export default function ConfirmEmailReset() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSendReset = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    // 1️⃣ Check if the email exists in Supabase
    const { data: users, error: fetchError } = await supabase
      .from("profiles") // replace with your table name if different
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();

    if (fetchError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    if (!users) {
      setError("Email not found. Please check and try again.");
      setLoading(false);
      return;
    }

    // 2️⃣ Send the password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setMessage("Password reset email sent! Check your inbox.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/30 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 p-8">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          Forgot Password
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Enter your email to receive a password reset link
        </p>

        <div className="space-y-4">
          <div className="relative group">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder-gray-500 text-white group-hover:border-gray-600"
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400" />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          {message && (
            <p className="text-green-400 text-sm text-center">{message}</p>
          )}

          <button
            onClick={handleSendReset}
            disabled={loading || !email}
            className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
              loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl active:scale-[0.99]"
            } flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Reset Link
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={() => navigate("/")}
            className="mt-4 w-full text-sm text-gray-300 hover:text-white transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
