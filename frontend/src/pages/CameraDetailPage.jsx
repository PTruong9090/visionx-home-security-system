import { getOneCamera } from "../api/cameraAPI"

import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import EventsCard from "../components/cameraDetail/EventsCard"
import OverviewCard from "../components/cameraDetail/OverviewCard"
import HealthCard from "../components/cameraDetail/HealthCard"
import InfoCard from "../components/cameraDetail/InfoCard"
import CameraPlayer from "../components/cameraDetail/CameraPlayer"

export default function CameraDetailPage() {
    const [camera, setCamera] = useState(null)
    const { cameraId } = useParams()
    const [ activeTab, setActiveTab ] = useState("overview")

    const isOnline = camera?.enabled
    const statusText = isOnline ? "Online" : "Offline"
    const statusColor = isOnline ? "text-[#22C55E]" : "text-[#EF4444]"
    const dotColor = isOnline ? "bg-green-500" : "bg-red-500"

    const isRecording = camera?.recording_enabled


    useEffect(() => {
        async function fetchCamera(cameraId) {
            try {
                const res = await getOneCamera(cameraId)
                setCamera(res)

            } catch (error) {
                console.error("Failed to fetch camera:", error)
            }
        }

        fetchCamera(cameraId)
    }, [cameraId])

    if (!camera) {
        return <p>Loading camera...</p>
    }

    return (
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-4">

            <div className="flex justify-between">
                <h2 className="text-xl font-semibold">{camera?.name}</h2>
                <button>...</button>
            </div>

            <div className="flex gap-3 items-center">
                <div className="text-s text-[#CBD5E1]">{camera?.location}</div>

                <div className={`p-2 flex items-center gap-2 ${statusColor}`}>
                    <div className={`h-3 w-3 rounded-full ${dotColor}`} />
                    <p>{statusText}</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className={` ${isRecording ? "h-3 w-3 rounded-full bg-orange-400" : ""}`}></div>
                    <div>{camera?.recording_enabled ? "Recording" : ""}</div>
                </div>
            </div>

            <div className="rounded-md aspect-video w-4/5 mx-auto">
                <CameraPlayer 
                    camera={camera}
                />
            </div>

            <div className="border-b border-[#1B2731]">
                <div className="flex gap-12">
                    {["overview", "info", "health", "events"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`border-b-2 pb-3 text-sm font-medium capitalize ${
                        activeTab === tab
                            ? "border-[#3B82F6] text-[#F8FAFC]"
                            : "border-transparent text-[#94A3B8] hover:text-[#F8FAFC]"
                        }`}
                    >
                        {tab}
                    </button>
                    ))}
                </div>
            </div>

            {activeTab === "overview" && <OverviewCard camera={camera} />}
            {activeTab === "info" && <div>Info card later</div>}
            {activeTab === "health" && <div>Health card later</div>}
            {activeTab === "events" && <div>Events card later</div>}

            <div className="flex gap-4 justify-end items-center m-4">
                <button className="px-4 py-3 rounded-md bg-[#3B82F6] hover:bg-[#2563EB]">Test Connection</button>
                <button className="px-4 py-3 rounded-md bg-[#111820] border border-[#24313C]">Edit Camera</button>
            </div>
        </div>
    )
}