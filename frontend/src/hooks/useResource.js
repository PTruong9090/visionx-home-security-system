import { useCallback, useEffect, useState, useRef } from "react";

export default function useResource(key, fetcher, {enabled = true} = {}) {
    const [ data, setData ] = useState(null)
    const [ loading, setLoading ] = useState(enabled)
    const [ error, setError ] = useState("")
    const [ reloadCount, setReloadCount ] = useState(0)

    const requestSeq = useRef(0)

    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher

    const serializedKey = JSON.stringify(key)

    useEffect(() => {
        if (!enabled) {
            setLoading(false)
            return
        }

        const controller = new AbortController()
        const seq = ++requestSeq.current
        const isStale = () => seq !== requestSeq.current || controller.signal.aborted

        async function run() {
            setLoading(true)
            setError('')

            try {
                const value = await fetcherRef.current({ signal: controller.signal })
                if (isStale()) return
                setData(value)

            } catch (err) {
                if (isStale()) return
                setError(err?.message ?? "Request failed")
                console.error(err?.message ?? "Request failed")

            } finally {
                if (!isStale()) setLoading(false)
            }
        }

        run()

        return () => controller.abort()
    }, [serializedKey, enabled, reloadCount])

    const reload = useCallback(() => setReloadCount((c) => c + 1), [])

    return { data, loading, error, reload, setData }
}