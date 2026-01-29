import { createContext, useState, useEffect } from "react"
import { supabase } from "../services/supabase"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1️⃣ Check active session on mount
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
      }
      setLoading(false)
    })

    // 2️⃣ Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 3️⃣ Optional: logout function
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  // 4️⃣ Optional: value can also include login/signup helpers
  const value = { user, session, loading, logout }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
