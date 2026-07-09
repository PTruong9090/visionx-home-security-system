import { useState, useEffect, useRef } from "react"
import { MoreVertical, Eye, Pencil, Trash } from "lucide-react"
import { NavLink } from "react-router-dom"

export default function CameraActionsMenu({ cameraId, onDelete }) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }

    }, [])

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="rounded-lg p-1 text-[#CBD5E1] hover:bg-[#16212B]"
            >
                <MoreVertical size={18} />
            </button>

            {open && (
                <div className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-[#24313C] bg-[#111820] p-1 shadow-xl">
                    <NavLink
                        to={`/cameras/${cameraId}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#CBD5E1] hover:bg-[#16212B]"
                    >
                        <Eye size={14} />
                        View
                    </NavLink>

                    <NavLink
                        to={`/cameras/${cameraId}/edit`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#CBD5E1] hover:bg-[#16212B]"
                    >
                        <Pencil size={14} />
                        Edit
                    </NavLink>

                    <button
                        onClick={() => {
                            onDelete()
                            setOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/40"
                    >
                        <Trash size={14} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}