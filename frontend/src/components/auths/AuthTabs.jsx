import { useNavigate } from "react-router-dom"

export default function AuthTabs({ active }) {
    const navigate = useNavigate()

    const tabClass = (tab) =>
        tab === active
            ? "flex-1 border-b-2 border-[#3B82F6] pb-3 text-sm font-medium text-[#3B82F6]"
            : "flex-1 border-b-2 border-transparent pb-3 text-sm font-medium text-[#94A3B8] hover:text-white"

    return (
        <div className="mb-8 flex gap-6 border-b border-[#24313C]">
            <button
                type="button"
                className={tabClass("login")}
                onClick={() => navigate("/login")}
            >
                Login
            </button>
            <button
                type="button"
                className={tabClass("signup")}
                onClick={() => navigate("/signup")}
            >
                Sign Up
            </button>
        </div>
    )
}
