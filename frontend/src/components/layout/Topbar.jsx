import { useEffect, useState } from "react"
import { checkHealth } from "../../api/healthAPI"

export default function Topbar() {
    const [isOnline, setIsOnline] = useState(false)

    useEffect(() => {
        try {
            setIsOnline(checkHealth() ? true : false)
        } catch (error) {
            setIsOnline(false)
        }
    },[])

    return (
        <div className="flex justify-start p-2 font-semibold bg-gray-200">
            <h2>VisionX / System {isOnline ? "Online" : "Offline"}</h2>
        </div>
    )
}