import { useState, useEffect } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"

import { 
  User, 
  Camera, 
  Edit2, 
  Save, 
  X,
  Wallet, 
  LogOut, 
  ArrowLeft, 
  Users,
  Image as ImageIcon,
  Mail,
  Calendar,
  Globe,
  Plus,
  Lock,
  Eye,
  Loader2,
  CreditCard,
  Phone  // Added Phone icon
} from "lucide-react"

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [newName, setNewName] = useState("")
  const [uploading, setUploading] = useState(false)

  // Phone number state
  const [editingPhone, setEditingPhone] = useState(false)
  const [newPhone, setNewPhone] = useState("")

  const [groups, setGroups] = useState([])
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [groupName, setGroupName] = useState("")
  const [editingBioGroupId, setEditingBioGroupId] = useState(null)
  const [groupBio, setGroupBio] = useState("")

  // Wallet State
  const [wallet, setWallet] = useState(null)
  const [loadingWallet, setLoadingWallet] = useState(true)

  // Private Rooms State
  const [showPrivateRoomModal, setShowPrivateRoomModal] = useState(false)
  const [privateRooms, setPrivateRooms] = useState([])
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    price: ""
  })
  const [creatingRoom, setCreatingRoom] = useState(false)
  
  // Private Room Editing States
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [editingRoomName, setEditingRoomName] = useState("")
  const [editingRoomDescriptionId, setEditingRoomDescriptionId] = useState(null)
  const [editingRoomDescription, setEditingRoomDescription] = useState("")
  const [editingRoomPriceId, setEditingRoomPriceId] = useState(null)
  const [editingRoomPrice, setEditingRoomPrice] = useState("")
  const [editingRoomImageId, setEditingRoomImageId] = useState(null)
  const [uploadingRoomImage, setUploadingRoomImage] = useState(false)

  /* =========================
     FETCH PROFILE
  ========================== */
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!error) {
      setProfile(data)
      setNewName(data.username)
      setNewPhone(data.phone_number || "") // Initialize phone number
    }
  }

  /* =========================
     FETCH WALLET BALANCE
  ========================== */
  const fetchWalletBalance = async () => {
    setLoadingWallet(true)
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance, currency")
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No wallet found, create one
          await createDefaultWallet()
          return fetchWalletBalance() // Retry after creation
        }
        console.error("Error fetching wallet:", error)
        return
      }

      setWallet(data)
    } catch (err) {
      console.error("Error in fetchWalletBalance:", err)
    } finally {
      setLoadingWallet(false)
    }
  }

  /* =========================
     CREATE DEFAULT WALLET
  ========================== */
  const createDefaultWallet = async () => {
    const defaultWallet = {
      user_id: user.id,
      balance: 0.00,
      currency: "KSH",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from("wallets")
      .insert([defaultWallet])

    if (error) {
      console.error("Error creating wallet:", error)
      alert("Failed to create wallet")
    }
  }

  /* =========================
     FETCH USER GROUPS
  ========================== */
  const fetchMyGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", user.id)

    if (!error) setGroups(data)
  }

  /* =========================
     FETCH PRIVATE ROOMS
  ========================== */
  const fetchPrivateRooms = async () => {
    const { data, error } = await supabase
      .from("private_rooms")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (!error) setPrivateRooms(data)
  }

  useEffect(() => {
    fetchProfile()
    fetchWalletBalance()
    fetchMyGroups()
    fetchPrivateRooms()
  }, [user.id])

  /* =========================
     HANDLE PHONE NUMBER CHANGE
  ========================== */
  const handlePhoneChange = async () => {
    const phone = newPhone.trim();
    
    // Basic validation
    if (!phone) {
      // Clear phone number if empty
      const { error } = await supabase
        .from("profiles")
        .update({ phone_number: null })
        .eq("id", user.id)
      
      if (!error) {
        setProfile((prev) => ({ ...prev, phone_number: null }))
        setEditingPhone(false)
      }
      return
    }
    
    // Enhanced validation for international numbers
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,3}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}$/;
    
    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid phone number (e.g., +254 712 345 678)");
      return;
    }
    
    // Format phone number (optional)
    const formattedPhone = phone.replace(/\s+/g, '');
    
    const { error } = await supabase
      .from("profiles")
      .update({ phone_number: formattedPhone })
      .eq("id", user.id)

    if (error) {
      console.error("Error updating phone number:", error)
      alert("Failed to update phone number")
      return
    }

    setProfile((prev) => ({ ...prev, phone_number: formattedPhone }))
    setEditingPhone(false)
  }

  /* =========================
     CREATE PRIVATE ROOM
  ========================== */
  const handleCreatePrivateRoom = async () => {
    if (!roomForm.name.trim()) {
      alert("Room name is required")
      return
    }

    if (!roomForm.price || isNaN(parseFloat(roomForm.price)) || parseFloat(roomForm.price) < 0) {
      alert("Please enter a valid price")
      return
    }

    setCreatingRoom(true)

    const roomData = {
      name: roomForm.name.trim(),
      description: roomForm.description.trim(),
      price: parseFloat(roomForm.price),
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("private_rooms")
      .insert([roomData])
      .select()

    if (error) {
      console.error("Error creating private room:", error)
      alert("Failed to create private room")
      setCreatingRoom(false)
      return
    }

    // Reset form and close modal
    setRoomForm({
      name: "",
      description: "",
      price: ""
    })
    setShowPrivateRoomModal(false)
    
    // Refresh private rooms list
    fetchPrivateRooms()
    setCreatingRoom(false)
    
    alert("Private room created successfully!")
  }

  /* =========================
     HANDLE ROOM IMAGE CHANGE
  ========================== */
  const handleRoomImageChange = async (e, roomId) => {
    const file = e.target.files[0]
    if (!file) return

    setEditingRoomImageId(roomId)
    setUploadingRoomImage(true)

    try {
      const fileName = `private_rooms/${roomId}-${Date.now()}-${file.name}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload image")
        setEditingRoomImageId(null)
        setUploadingRoomImage(false)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      // Update room with new image URL
      await supabase
        .from("private_rooms")
        .update({ 
          image_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", roomId)

      // Update local state
      setPrivateRooms((prev) =>
        prev.map((room) =>
          room.id === roomId ? { ...room, image_url: urlData.publicUrl } : room
        )
      )

    } catch (err) {
      console.error("Error updating room image:", err)
      alert("Failed to update room image")
    } finally {
      setEditingRoomImageId(null)
      setUploadingRoomImage(false)
    }
  }

  /* =========================
     RENAME PRIVATE ROOM
  ========================== */
  const handleRenamePrivateRoom = async (roomId) => {
    if (!editingRoomName.trim()) return

    await supabase
      .from("private_rooms")
      .update({ 
        name: editingRoomName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", roomId)

    setPrivateRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, name: editingRoomName.trim() } : room
      )
    )

    setEditingRoomId(null)
    setEditingRoomName("")
  }

  /* =========================
     UPDATE PRIVATE ROOM DESCRIPTION
  ========================== */
  const handleUpdatePrivateRoomDescription = async (roomId) => {
    await supabase
      .from("private_rooms")
      .update({ 
        description: editingRoomDescription.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", roomId)

    setPrivateRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, description: editingRoomDescription.trim() } : room
      )
    )

    setEditingRoomDescriptionId(null)
    setEditingRoomDescription("")
  }

  /* =========================
     UPDATE PRIVATE ROOM PRICE
  ========================== */
  const handleUpdatePrivateRoomPrice = async (roomId) => {
    if (!editingRoomPrice || isNaN(parseFloat(editingRoomPrice)) || parseFloat(editingRoomPrice) < 0) {
      alert("Please enter a valid price")
      return
    }

    await supabase
      .from("private_rooms")
      .update({ 
        price: parseFloat(editingRoomPrice),
        updated_at: new Date().toISOString()
      })
      .eq("id", roomId)

    setPrivateRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, price: parseFloat(editingRoomPrice) } : room
      )
    )

    setEditingRoomPriceId(null)
    setEditingRoomPrice("")
  }

  /* =========================
     UPDATE USER AVATAR
  ========================== */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    const fileName = `users/${user.id}-${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id)

    setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))
    setUploading(false)
  }

  /* =========================
     UPDATE USERNAME
  ========================== */
  const handleNameChange = async () => {
    if (!newName.trim()) return

    await supabase
      .from("profiles")
      .update({ username: newName.trim() })
      .eq("id", user.id)

    setProfile((prev) => ({ ...prev, username: newName.trim() }))
  }

  /* =========================
     RENAME GROUP
  ========================== */
  const handleRenameGroup = async (groupId) => {
    if (!groupName.trim()) return

    await supabase
      .from("groups")
      .update({ name: groupName.trim() })
      .eq("id", groupId)

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, name: groupName.trim() } : g
      )
    )

    setEditingGroupId(null)
    setGroupName("")
  }

  /* =========================
     UPDATE GROUP BIO
  ========================== */
  const handleUpdateGroupBio = async (groupId) => {
    await supabase
      .from("groups")
      .update({ bio: groupBio.trim() })
      .eq("id", groupId)

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, bio: groupBio.trim() } : g
      )
    )

    setEditingBioGroupId(null)
    setGroupBio("")
  }

  /* =========================
     UPDATE GROUP AVATAR
  ========================== */
  const handleGroupAvatarChange = async (e, groupId) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = `groups/${groupId}-${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.error(error.message)
      return
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    await supabase
      .from("groups")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", groupId)

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, avatar_url: urlData.publicUrl } : g
      )
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="relative w-32 h-32">
                <img
                  src={profile.avatar_url || "https://via.placeholder.com/128"}
                  className="w-full h-full rounded-full border-4 border-purple-500/30 object-cover"
                  alt="avatar"
                />
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Click to change photo
              </p>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {editingGroupId === "user" ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter new name"
                      />
                      <button
                        onClick={() => {
                          handleNameChange()
                          setEditingGroupId(null)
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                      <button
                        onClick={() => {
                          setEditingGroupId("user")
                          setNewName(profile.username)
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">Email</span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{user.email}</p>
                  </div>
                  
                  {/* Phone Number Card */}
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs">Phone</span>
                    </div>
                    {editingPhone ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="+254..."
                          pattern="[\+]?[0-9\s\-\(\)]+"
                          maxLength="20"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={handlePhoneChange}
                            className="p-1 text-green-400 hover:text-green-300"
                            title="Save"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPhone(false)
                              setNewPhone(profile.phone_number || "")
                            }}
                            className="p-1 text-gray-400 hover:text-gray-300"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-300">
                          {profile.phone_number || "Not set"}
                        </p>
                        <button
                          onClick={() => {
                            setEditingPhone(true)
                            setNewPhone(profile.phone_number || "")
                          }}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title="Edit phone number"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Groups</span>
                    </div>
                    <p className="text-sm text-gray-300">{groups.length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs">Private Rooms</span>
                    </div>
                    <p className="text-sm text-gray-300">{privateRooms.length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Member Since</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Balance Card */}
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      
                      
                    </div>
                  </div>
                  
                  {loadingWallet ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                  ) : (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {wallet ? `${wallet.currency} ${parseFloat(wallet.balance).toFixed(2)}` : "KSH 0.00"}
                      </div>
                      <p className="text-xs text-gray-400">Current balance</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => navigate("/wallet")}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 
                           bg-gradient-to-r from-purple-600 to-pink-600 
                           hover:from-purple-700 hover:to-pink-700
                           text-white font-medium rounded-xl shadow transition"
                >
                  <Wallet className="w-5 h-5" />
                  View Wallet Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Private Rooms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-400" />
              My Private Rooms
            </h3>
            <button
              onClick={() => setShowPrivateRoomModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Private Room
            </button>
          </div>

          {privateRooms.length === 0 ? (
            <div className="bg-gray-800/30 rounded-2xl p-12 text-center border border-dashed border-gray-700">
              <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No private rooms yet</p>
              <p className="text-gray-500 text-sm mb-6">Create private rooms with paid access for exclusive content</p>
              <button
                onClick={() => setShowPrivateRoomModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
              >
                Create Private Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {privateRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-blue-500/30 transition-all"
                >
                  {/* Room Header with Edit Button and Image Upload */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Room Image with Upload Option */}
                    <div className="relative group">
                      {editingRoomImageId === room.id ? (
                        <div className="w-12 h-12 rounded-full bg-blue-900/30 border-2 border-blue-500/50 flex items-center justify-center overflow-hidden">
                          {room.image_url ? (
                            <img
                              src={room.image_url}
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Lock className="w-6 h-6 text-blue-400" />
                          )}
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin mb-1" />
                            <span className="text-xs text-white">Uploading...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-blue-900/30 border-2 border-blue-500/30 flex items-center justify-center overflow-hidden">
                            {room.image_url ? (
                              <img
                                src={room.image_url}
                                alt={room.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Lock className="w-6 h-6 text-blue-400" />
                            )}
                          </div>
                          <label className="absolute -bottom-1 -right-1 bg-gray-800 p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors group-hover:opacity-100 opacity-70">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleRoomImageChange(e, room.id)}
                              disabled={editingRoomImageId === room.id}
                            />
                            <ImageIcon className="w-3 h-3 text-gray-300" />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {editingRoomId === room.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            value={editingRoomName}
                            onChange={(e) => setEditingRoomName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Room name"
                          />
                          <button
                            onClick={() => handleRenamePrivateRoom(room.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRoomId(null)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-white">{room.name}</h4>
                          <button
                            onClick={() => {
                              setEditingRoomId(room.id)
                              setEditingRoomName(room.name)
                            }}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Price with Edit Button */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Price</span>
                      {editingRoomPriceId === room.id ? (
                        <button
                          onClick={() => handleUpdatePrivateRoomPrice(room.id)}
                          className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save Price
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRoomPriceId(room.id)
                            setEditingRoomPrice(room.price?.toString() || "0")
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Price
                        </button>
                      )}
                    </div>

                    {editingRoomPriceId === room.id ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          KSH
                        </span>
                        <input
                          type="number"
                          value={editingRoomPrice}
                          onChange={(e) => setEditingRoomPrice(e.target.value)}
                          className="w-full pl-12 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-blue-400 bg-gray-900/30 rounded-lg p-3">
                        KSH {room.price || "0"}
                      </p>
                    )}
                  </div>

                  {/* Room Description with Edit Button */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Description</span>
                      {editingRoomDescriptionId === room.id ? (
                        <button
                          onClick={() => handleUpdatePrivateRoomDescription(room.id)}
                          className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save Description
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRoomDescriptionId(room.id)
                            setEditingRoomDescription(room.description || "")
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Description
                        </button>
                      )}
                    </div>

                    {editingRoomDescriptionId === room.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingRoomDescription}
                          onChange={(e) => setEditingRoomDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          rows="3"
                          placeholder="Enter room description..."
                        />
                      </div>
                    ) : (
                      <p className="text-gray-300 text-sm p-3 bg-gray-900/30 rounded-lg">
                        {room.description || "No description provided"}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/privateroomchat/${room.id}`)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Enter Chat
                    </button>
                    
                    <button
                      onClick={() => navigate(`/privateroom/${room.id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                    <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                      Paid Access
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Groups Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              My Groups (Admin)
            </h3>
            <button
              onClick={() => navigate("/groups")}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Create Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-gray-800/30 rounded-2xl p-12 text-center border border-dashed border-gray-700">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No groups yet</p>
              <p className="text-gray-500 text-sm mb-6">Create your first group to start chatting with multiple people</p>
              <button
                onClick={() => navigate("/groups")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
              >
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-purple-500/30 transition-all group"
                >
                  {/* Group Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={group.avatar_url || "https://via.placeholder.com/48"}
                        className="w-12 h-12 rounded-full border-2 border-purple-500/30 object-cover"
                        alt="group avatar"
                      />
                      <label className="absolute -bottom-1 -right-1 bg-gray-800 p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleGroupAvatarChange(e, group.id)}
                        />
                        <ImageIcon className="w-3 h-3 text-gray-300" />
                      </label>
                    </div>

                    <div className="flex-1">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Group name"
                          />
                          <button
                            onClick={() => handleRenameGroup(group.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingGroupId(null)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-white">{group.name}</h4>
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id)
                              setGroupName(group.name)
                            }}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Bio */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Group Bio</span>
                      {editingBioGroupId === group.id ? (
                        <button
                          onClick={() => handleUpdateGroupBio(group.id)}
                          className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save Bio
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingBioGroupId(group.id)
                            setGroupBio(group.bio || "")
                          }}
                          className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Bio
                        </button>
                      )}
                    </div>

                    {editingBioGroupId === group.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={groupBio}
                          onChange={(e) => setGroupBio(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          rows="3"
                          placeholder="Enter group bio..."
                        />
                      </div>
                    ) : (
                      <p className="text-gray-300 text-sm p-3 bg-gray-900/30 rounded-lg">
                        {group.bio || "No bio set for this group."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="space-y-4">
            <button
              onClick={logout}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/help")}
                className="py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors"
              >
                Help & Support
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Private Room Creation Modal */}
      {showPrivateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Create Private Room</h2>
              </div>
              <button
                onClick={() => setShowPrivateRoomModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({...roomForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter room name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe what this private room offers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price (KSH) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    KSH
                  </span>
                  <input
                    type="number"
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({...roomForm, price: e.target.value})}
                    className="w-full pl-14 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowPrivateRoomModal(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors"
                  disabled={creatingRoom}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrivateRoom}
                  disabled={creatingRoom}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  {creatingRoom ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Create Room
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}