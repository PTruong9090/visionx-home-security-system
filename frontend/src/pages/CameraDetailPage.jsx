import { getOneCamera } from "../api/cameraAPI"

import { useParams, NavLink, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

import { testCamera } from "../api/cameraAPI"

import EventsCard from "../components/cameraDetail/EventsCard"
import OverviewCard from "../components/cameraDetail/OverviewCard"
import HealthCard from "../components/cameraDetail/HealthCard"
import InfoCard from "../components/cameraDetail/InfoCard"
import CameraPlayer from "../components/cameraDetail/CameraPlayer"
import CameraActionsMenu from "../components/cameras/CamerasActionsMenu"

import useCameraDelete from "../hooks/useCameraDelete"
import CameraDeleteModal from "../components/modals/CameraDeleteModal"


export default function CameraDetailPage() {
    const navigate = useNavigate()

    const [ camera, setCamera ] = useState(null)
    const { cameraId } = useParams()
    const [ activeTab, setActiveTab ] = useState("overview")
    const [ testing, setTesting ] = useState(false)
    const [ testResult, setTestResult ] = useState(null)

    const {
        cameraToDelete,
        isDeleting,
        requestDelete,
        cancelDelete,
        confirmDelete,
    } = useCameraDelete({
        onDeleted: () => {
            navigate("/cameras")
        },
    })


    const isOnline = camera?.enabled
    const statusText = isOnline ? "Online" : "Offline"
    const statusColor = isOnline ? "text-[#22C55E]" : "text-[#EF4444]"
    const dotColor = isOnline ? "bg-green-500" : "bg-red-500"

    const isRecording = camera?.recording_enabled

    async function testCameraConnection() {
        setTesting(true)
        setTestResult(null)

        try {
            const res = await testCamera(cameraId)

            setTestResult({
                success: res.status === "online" ? true : false,
                message: res.message || "Camera connection successful.",
            })

        } catch (error) {
            console.error("Failed to test camera:", error)

            setTestResult({
                success: false,
                message: "Failed to connect to camera.",
            })
        } finally {
            setTesting(false)
            setTimeout(() => {
                setTestResult(null)
            }, 3000)
        }
    }

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
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col gap-4">

            <div className="flex justify-between">
                <h2 className="text-xl font-semibold">{camera?.name}</h2>
                <CameraActionsMenu 
                    cameraId={cameraId}
                    onDelete={() => requestDelete(camera)}
                />
            </div>

            <div className="flex gap-3 items-center">
                <div className="text-sm text-[#CBD5E1]">{camera?.location}</div>

                <div className={`p-2 flex items-center gap-1 ${statusColor}`}>
                    <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <p className="text-sm">{statusText}</p>
                </div>
                
                <div className="flex items-center gap-1">
                    <div className={` ${isRecording ? "h-2 w-2 rounded-full bg-orange-400" : ""}`}></div>
                    <div className="text-sm">{isRecording ? "Recording" : ""}</div>
                </div>
            </div>

            <div className="rounded-md aspect-video w-4/5 mx-auto">
                <CameraPlayer 
                    camera={camera}
                    streamURL="http://localhost:8889/logitech"
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
            {activeTab === "info" && <InfoCard camera={camera} />}
            {activeTab === "health" && <HealthCard camera={camera} />}
            {activeTab === "events" && <EventsCard camera={camera} />}

            <div className="flex gap-4 justify-end items-center mt-auto">
                {testResult && (
                    <p className={`text-sm ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                        {testResult.message}
                    </p>
                )}

                <div className="flex justify-end gap-4 items-center">
                    <button 
                        disabled={testing}
                        onClick={testCameraConnection}
                        className="px-4 py-3 rounded-md bg-[#3B82F6] hover:bg-[#2563EB]"
                    >
                            {testing ? "Testing..." : "Test Connection"}
                    </button>

                    <NavLink to={`/cameras/${cameraId}/edit`} className="px-4 py-3 rounded-md bg-[#111820] border border-[#24313C]">Edit Camera</NavLink>
                </div>
            </div>

            <CameraDeleteModal
                camera={cameraToDelete}
                isDeleting={isDeleting}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
            />

        </div>
    )
}