import { Shield, Server, Zap } from "lucide-react"

const features = [
    {
        icon: Shield,
        title: "Privacy First",
        description: "Keep your footage and data on your own network.",
    },
    {
        icon: Server,
        title: "Local Storage",
        description: "Record to your NAS. No cloud required.",
    },
    {
        icon: Zap,
        title: "Smart Automation",
        description: "AI-powered events and alerts that work for you.",
    },
]

export default function AuthLayout({ children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0E13] p-6">
            <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-[#1B2731] bg-[#0A0E13] lg:grid-cols-2">
                <aside className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
                    <div
                        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#3B82F6] opacity-20 blur-3xl"
                        aria-hidden="true"
                    />

                    <div className="relative flex flex-col items-center gap-3 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/40">
                            <Shield className="h-8 w-8 text-[#3B82F6]" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold">
                                Vision<span className="text-[#3B82F6]">X</span>
                            </h1>
                            <p className="text-xs tracking-widest text-[#94A3B8]">
                                HOME SECURITY SYSTEM
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-3">
                        <h2 className="text-2xl font-semibold">
                            Your home. Your data.
                            <br />
                            Total control.
                        </h2>
                        <p className="text-sm text-[#94A3B8]">
                            Self-hosted security camera monitoring, local recording, and
                            intelligent automation - all on your terms.
                        </p>
                    </div>

                    <div className="relative flex flex-col gap-4">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111820] ring-1 ring-[#24313C]">
                                    <Icon className="h-5 w-5 text-[#3B82F6]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{title}</p>
                                    <p className="text-xs text-[#94A3B8]">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex flex-col justify-center bg-[#111820] p-8 sm:p-12">
                    {children}
                </main>
            </div>
        </div>
    )
}
