import { useState } from "react"
import { supabase } from "../services/supabase"
import { useNavigate } from "react-router-dom"
import { 
  Mail, 
  Lock, 
  ArrowRight,
  Loader2,
  MessageSquare,
  LogIn,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Key  // Added for forgot password icon
} from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate("/home")
  }

  const handleForgotPassword = () => {
    navigate("/confirm-email-reset")  // Updated to match the actual page name
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/30 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50">
        {/* Enhanced Header with tuuChat */}
        <div className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 rounded-t-3xl p-8 text-center border-b border-gray-700/50">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageSquare className="w-10 h-10 text-white" />
            <h1 className="text-4xl font-bold text-white tracking-tight">
              tuu<span className="text-pink-300">Chat</span>
            </h1>
          </div>
          <p className="text-gray-200 text-lg font-medium">
            Welcome Back • Continue Your Journey
          </p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <LogIn className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Login to Your Account
            </h2>
            <p className="text-gray-400">
              Enter your credentials to continue chatting
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder-gray-500 text-white group-hover:border-gray-600"
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder-gray-500 text-white group-hover:border-gray-600"
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

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
                  Logging In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Login to tuuChat
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl animate-in fade-in duration-300">
              <p className="text-red-300 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Divider */}
          <div className="mt-8 flex items-center">
            <div className="flex-1 border-t border-gray-700/50"></div>
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-700/50"></div>
          </div>

          {/* Sign Up Redirect */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    Don't have an account yet?
                  </p>
                  <button
                    onClick={() => navigate("/signup")}
                    className="text-blue-400 font-semibold hover:text-blue-300 transition-colors duration-200 inline-flex items-center gap-1 group mt-1"
                  >
                    Create your free account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-700/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Shield className="w-3 h-3" />
              Secure Connection • End-to-End Encrypted
            </div>
          </div>

          {/* Demo Account Info */}
          <div className="mt-6 text-center">
            <details className="cursor-pointer">
              <summary className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                Need a demo account?
              </summary>
              <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <p className="text-sm text-blue-300 mb-1">
                  <strong>Demo Credentials:</strong>
                </p>
                <p className="text-xs text-blue-400">
                  Email: demo@tuuchat.com
                  <br />
                  Password: demopassword123
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}