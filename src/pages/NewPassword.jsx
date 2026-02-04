import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function NewPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const accessToken = searchParams.get("access_token"); // Supabase sends this token in URL

  const handleUpdatePassword = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    }, {
      // Pass the token from the URL
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully!");
    setLoading(false);

    setTimeout(() => navigate("/"), 2000); // Redirect to login
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Invalid password reset link</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div className="bg-gray-800/80 rounded-3xl p-8 w-full max-w-md border border-gray-700/50">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          Set New Password
        </h1>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500"
          />

          {error && <p className="text-red-400 text-center">{error}</p>}
          {message && <p className="text-green-400 text-center">{message}</p>}

          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold ${
              loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
