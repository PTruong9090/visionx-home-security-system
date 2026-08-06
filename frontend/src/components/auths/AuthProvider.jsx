import { useState, useEffect, useCallback } from "react";

import { getUser } from "../../api/userAPI";
import { setOnUnAuthorized } from "../../api/https";

import { AuthContext } from "../../context/authContext";

import { messageForError } from "../../api/errorMessage";

export function AuthProvider({ children }) {
    const [ user, setUser ] = useState(null)
    const [ isLoading, setIsLoading ] = useState(true)

    const [ authError, setAuthError ] = useState("")

    const [ reloadCount, setReloadCount ] = useState(0)
    const retry = useCallback(() => setReloadCount((c) => c + 1), [])

    useEffect(() => {
        setOnUnAuthorized(() => setUser(null))
    }, [])

    useEffect(() => {
        async function fetchUser() {
            setIsLoading(true)
            setAuthError("")

            try {
                const res = await getUser()
                setUser(res)    
        
            } catch (err) {
                setUser(null)
                if (err.status !== 401) {
                    setAuthError(messageForError(err))
                }

            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [reloadCount])

    return (
        <AuthContext.Provider value={{user, isLoading, setUser, authError, retry}}>{children}</AuthContext.Provider>
    )
}