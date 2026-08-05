import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import { Spinner } from "../ui/Spinner";


export default function ProtectedRoute() {
    const location = useLocation()
    const { user, isLoading, authError, retry } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        )
    }

    if (authError) {
        return (
            <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
                <p role="alert" className="text-sm text-[#EF4444]">{authError}</p>
                <button 
                    className="rounded-md bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]" 
                    onClick={retry}
                >
                    Try again
                </button>
            </div>
        )
    }

    if (!user) {
        return <Navigate to='/login' state={{ from: location }} replace/>
    }

    return (
        <Outlet />
    )
}