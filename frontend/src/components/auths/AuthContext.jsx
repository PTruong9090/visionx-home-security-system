import { useState, useEffect, createContext, useContext } from "react";

import { getUser } from "../../api/userAPI";
import { setOnUnAuthorized } from "../../api/https";


const AuthContext = createContext(null)

export function useAuth() {
    const context = useContext(AuthContext)

    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setOnUnAuthorized(() => setUser(null))
    }, [])

    useEffect(() => {
        async function fetchUser() {
            setIsLoading(true)

            try {
                const res = await getUser()
                setUser(res)
        
            } catch {
                setUser(null)

            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [])

    return (
        <AuthContext.Provider value={{user, isLoading, setUser}}>{children}</AuthContext.Provider>
    )
}