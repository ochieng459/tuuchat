import { useState } from "react"
import { supabase } from "../services/supabase"
import { useNavigate } from "react-router-dom"
import { 
  CheckCircle, 
  Mail, 
  User, 
  Lock, 
  ArrowRight,
  Loader2,
  MessageSquare,
  Shield,
  Eye,
  EyeOff,
  CheckSquare,
  Square
} from "lucide-react"

export default function Signup() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check if terms are accepted
    if (!acceptTerms) {
      setError("You must accept the Terms & Conditions to continue")
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id)

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setShowConfirmation(true)
  }

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Check Your Email!
              </h2>
              
              <div className="flex items-center justify-center mb-4 text-blue-400 bg-blue-900/20 py-2 px-4 rounded-full">
                <Mail className="w-5 h-5 mr-2" />
                <span className="font-medium">{email}</span>
              </div>
              
              <p className="text-gray-300 mb-6">
                We've sent a confirmation link to your email address. 
                Please click the link to verify your account and start using tuuChat.
              </p>
              
              <div className="bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-700/30">
                <p className="text-sm text-blue-300">
                  💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
                </p>
              </div>
              
              <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
              >
                Return to Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
              Connect • Chat • Share
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-400">
                Join our community and start chatting instantly
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    required
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder-gray-500 text-white group-hover:border-gray-600"
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400" />
                </div>
              </div>

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
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

              {/* Terms & Conditions Checkbox */}
              <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    className="mt-1 flex-shrink-0"
                  >
                    {acceptTerms ? (
                      <CheckSquare className="w-5 h-5 text-green-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-gray-300">
                        Terms & Conditions
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      I agree to the{" "}
                      <a 
                        href="https://tuuchatterms.netlify.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline transition-colors"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a 
                        href="https://tuuchatterms.netlify.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </p>
                    <div className="text-xs text-gray-500">
                      You must accept the terms to create an account
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !acceptTerms}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                  loading || !acceptTerms
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl active:scale-[0.99]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Your Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Get Started
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

            {/* Login Redirect */}
            <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-blue-400 font-semibold hover:text-blue-300 transition-colors duration-200 inline-flex items-center gap-1 group"
                >
                  Login here
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </p>
            </div>

            {/* Security Badge */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-700/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Shield className="w-3 h-3" />
                Secure Connection • End-to-End Encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}