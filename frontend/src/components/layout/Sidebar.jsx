import { NavLink } from "react-router-dom"
import { House, Cctv, FileVideo, Settings, Heart} from "lucide-react"

export default function Sidebar() {
    const navClass = ({ isActive }) =>
    isActive
      ? "flex gap-2 rounded-lg bg-[#10234A] px-3 py-2 text-white"
      : "flex gap-2 rounded-lg px-3 py-2 text-slate-400 hover:bg-[#111820] hover:text-white"


    return (
        <aside className="w-[220px] min-h-screen flex flex-col bg-[#0A0E13] p-4">
            <div className="m-6">
                <h1 className="font-bold text-xl">VisionX</h1>
                <p className="text-xs text-[#CBD5E1]">Home Security System</p>
            </div>

            <nav className="flex flex-col gap-2">
                <NavLink to="/dashboard" className={navClass}>
                    <House />
                    Dashboard
                </NavLink>

                <NavLink to="/cameras" className={navClass}>
                    <Cctv />
                    Cameras
                </NavLink>

                <NavLink to="/recordings" className={navClass}>
                    <FileVideo />
                    Recordings
                </NavLink>

                <NavLink to="/health" className={navClass}>
                    <Heart />
                    Health
                </NavLink>

                <NavLink to="/settings" className={navClass}>
                    <Settings />
                    Settings
                </NavLink>
            </nav>

            {/* TODO: User block/User profile */}
            <div>

            </div>
            
            
        </aside>
    )
}