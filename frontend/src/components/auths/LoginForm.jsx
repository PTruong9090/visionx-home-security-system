import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, Grid3x3 } from "lucide-react"

export default function LoginForm() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: true,
    })
    const [showPassword, setShowPassword] = useState(false)

    function handleChange(e) {
        const { name, value, type, checked } = e.target

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        })
    }

    function handleSubmit(e) {
        e.preventDefault()
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                    Email
                </label>
                <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="h-10 w-full rounded-lg border border-[#24313C] bg-[#0F1720] pr-3 pl-10 text-sm outline-none focus:border-[#3B82F6]"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className="h-10 w-full rounded-lg border border-[#24313C] bg-[#0F1720] pr-10 pl-10 text-sm outline-none focus:border-[#3B82F6]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#CBD5E1]">
                    <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-[#24313C] bg-[#0F1720] accent-[#3B82F6]"
                    />
                    Remember me
                </label>

                <Link to="/forgot-password" className="text-[#3B82F6] hover:underline">
                    Forgot password?
                </Link>
            </div>

            <button
                type="submit"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3B82F6] text-sm font-medium text-white hover:bg-[#2563EB]"
            >
                <Lock className="h-4 w-4" />
                Sign In
            </button>

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#24313C]" />
                <span className="text-xs text-[#94A3B8]">or</span>
                <div className="h-px flex-1 bg-[#24313C]" />
            </div>

            <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#24313C] text-sm text-[#CBD5E1] hover:bg-[#16212B]"
            >
                <Grid3x3 className="h-4 w-4" />
                Continue with Tailscale
            </button>

            <p className="text-center text-sm text-[#94A3B8]">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-[#3B82F6] hover:underline">
                    Sign up
                </Link>
            </p>
        </form>
    )
}
