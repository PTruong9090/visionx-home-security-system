import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"

import { useAuth } from "../auths/AuthContext"
import { logout } from "../../api/authAPI"

function getInitials(displayName) {
    const parts = displayName.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
    return (first + last).toUpperCase()
}

export default function UserCard() {
    const navigate = useNavigate()
    const { user, setUser } = useAuth()

    async function handleLogout() {
        try {
            await logout()
        } catch (error) {
            console.error("Failed to logout:", error)
        } finally {
            setUser(null)
            navigate('/login')
        }
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-[#1B2731] bg-[#111820] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10234A] text-sm font-medium text-white">
                {getInitials(user.display_name)}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-white">
                    {user.display_name}
                </span>
                <span className="truncate text-xs text-[#94A3B8]">
                    {user.email}
                </span>
            </div>

            <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="shrink-0 rounded-lg p-2 text-[#94A3B8] hover:bg-[#16212B] hover:text-white"
            >
                <LogOut className="h-4 w-4" />
            </button>
        </div>
    )
}
