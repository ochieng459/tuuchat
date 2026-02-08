import { createContext, useState, useEffect } from "react"
import { supabase } from "../services/supabase"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1️⃣ Check active session on mount
    let isMounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)
        }
      } catch (err) {
        console.error("getSession failed:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()

    // 2️⃣ Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        ;(async () => {
          try {
          if (event === "SIGNED_IN" && session?.user?.id) {
            await supabase
              .from("profiles")
              .update({ is_online: true })
              .eq("id", session.user.id)
          }

          if (event === "SIGNED_OUT" && session?.user?.id) {
            await supabase
              .from("profiles")
              .update({
                is_online: false,
                last_seen: new Date().toISOString()
              })
              .eq("id", session.user.id)
          }
          } catch (err) {
            console.error("Online status update failed:", err)
          }
        })()
      }
    )

    return () => {
      isMounted = false
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
