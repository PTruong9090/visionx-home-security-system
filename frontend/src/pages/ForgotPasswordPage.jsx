import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail, MailCheck } from "lucide-react"

import AuthLayout from "../components/auths/AuthLayout"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <AuthLayout>
            <Link
                to="/login"
                className="mb-8 flex w-fit items-center gap-2 text-sm text-[#94A3B8] hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to login
            </Link>

            {submitted ? (
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/40">
                        <MailCheck className="h-6 w-6 text-[#3B82F6]" />
                    </div>
                    <h2 className="text-2xl font-semibold">Check your email</h2>
                    <p className="max-w-sm text-sm text-[#94A3B8]">
                        If an account exists for <span className="text-white">{email}</span>,
                        we&apos;ve sent a link to reset your password.
                    </p>

                    <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="mt-2 text-sm text-[#3B82F6] hover:underline"
                    >
                        Didn&apos;t get it? Try again
                    </button>
                </div>
            ) : (
                <>
                    <div className="mb-8 flex flex-col gap-1 text-center">
                        <h2 className="text-2xl font-semibold">Forgot password?</h2>
                        <p className="text-sm text-[#94A3B8]">
                            Enter the email associated with your account and we&apos;ll send
                            you a reset link.
                        </p>
                    </div>

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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="h-10 w-full rounded-lg border border-[#24313C] bg-[#0F1720] pr-3 pl-10 text-sm outline-none focus:border-[#3B82F6]"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3B82F6] text-sm font-medium text-white hover:bg-[#2563EB]"
                        >
                            Send reset link
                        </button>
                    </form>
                </>
            )}
        </AuthLayout>
    )
}
