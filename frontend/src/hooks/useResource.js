import { useCallback, useEffect, useState, useRef } from "react";

export default function useResource(key, fetcher, {enabled = true} = {}) {
    const [ data, setDataState ] = useState(null)
    const [ loading, setLoading ] = useState(enabled)
    const [ error, setError ] = useState("")
    const [ reloadCount, setReloadCount ] = useState(0)

    const setData = useCallback((value) => {
        setDataState(value)
        setError("")
    }, [])

    const requestSeq = useRef(0)

    const fetcherRef = useRef(fetcher)
    
    useEffect(() => {
        fetcherRef.current = fetcher
    })

    const serializedKey = JSON.stringify(key)
    const [ prevKey, setPrevKey ] = useState(serializedKey)

    // Clear stale data
    if (prevKey !== serializedKey) {
        setPrevKey(serializedKey)
        setLoading(true)
        setDataState(null)
        setError("")
    }

    useEffect(() => {
        if (!enabled) return

        const controller = new AbortController()
        const seq = ++requestSeq.current
        const isStale = () => seq !== requestSeq.current || controller.signal.aborted

        async function run() {
            setLoading(true)
            setError("")

            try {
                const value = await fetcherRef.current({ signal: controller.signal })
                if (isStale()) return

                setDataState(value)

            } catch (err) {
                if (isStale()) return
                setError(err?.message ?? "Request failed")

            } finally {
                if (!isStale()) setLoading(false)
            }
        }

        run()

        return () => controller.abort()
    }, [serializedKey, enabled, reloadCount])

    const reload = useCallback(() => setReloadCount((c) => c + 1), [])

    return { data, loading: enabled && loading, error, reload, setData }
}