import { useState } from "react"
import { Link } from "react-router-dom"
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function SignupForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    function handleChange(e) {
        const { name, value } = e.target

        setFormData({
            ...formData,
            [name]: value,
        })
    }

    function handleSubmit(e) {
        e.preventDefault()
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                </label>
                <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                        className="h-10 w-full rounded-lg border border-[#24313C] bg-[#0F1720] pr-3 pl-10 text-sm outline-none focus:border-[#3B82F6]"
                    />
                </div>
            </div>

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
                        placeholder="Create a password"
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

            <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                </label>
                <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        className="h-10 w-full rounded-lg border border-[#24313C] bg-[#0F1720] pr-10 pl-10 text-sm outline-none focus:border-[#3B82F6]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3B82F6] text-sm font-medium text-white hover:bg-[#2563EB]"
            >
                <User className="h-4 w-4" />
                Create Account
            </button>

            <p className="text-center text-sm text-[#94A3B8]">
                Already have an account?{" "}
                <Link to="/login" className="text-[#3B82F6] hover:underline">
                    Log in
                </Link>
            </p>
        </form>
    )
}
