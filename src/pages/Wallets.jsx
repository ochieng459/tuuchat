import { useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase" // Make sure supabase client is set up

export default function Wallet() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    const fetchWalletData = async () => {
      setLoading(true)
      try {
        // Fetch wallet balance from server
        const res = await fetch(`https://tuuchatserver-production.up.railway.app/api/wallets/${user.id}`)
        if (!res.ok) throw new Error("Failed to fetch wallet balance")
        const data = await res.json()
        setBalance(data.balance)

        // Fetch transactions directly from Supabase
        const { data: txs, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setTransactions(txs)
      } catch (err) {
        console.error("Error fetching wallet data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Loading wallet data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-6">
      <button
        onClick={() => navigate("/profile")}
        className="self-start mb-6 flex items-center gap-2 text-gray-300 hover:text-white"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Profile
      </button>

      {/* Balance Card */}
      <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 text-center w-full max-w-md mb-8">
        <h1 className="text-2xl font-bold mb-4">My Wallet</h1>
        <p className="text-gray-400 mb-2">Current Balance</p>
        <p className="text-4xl font-bold text-green-400">KSH {balance}</p>
      </div>

      {/* Transactions List */}
      <div className="w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400">No transactions yet.</p>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-700"
              >
                <div>
                  <p className="font-medium">{tx.type}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <p
                  className={`font-bold ${
                    tx.type === "credit" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}KSH {tx.amount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
