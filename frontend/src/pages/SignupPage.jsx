import AuthLayout from "../components/auths/AuthLayout"
import AuthTabs from "../components/auths/AuthTabs"
import SignupForm from "../components/auths/SignupForm"

export default function SignupPage() {
    return (
        <AuthLayout>
            <AuthTabs active="signup" />

            <div className="mb-8 flex flex-col gap-1 text-center">
                <h2 className="text-2xl font-semibold">Create your account</h2>
                <p className="text-sm text-[#94A3B8]">
                    Set up VisionX to start monitoring your home.
                </p>
            </div>

            <SignupForm />
        </AuthLayout>
    )
}
