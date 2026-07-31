import { useParams, NavLink, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"

import { getOneCamera, testCamera, getStreamURL } from "../api/cameraAPI"
import { getHealthCheck } from "../api/healthAPI"
import { Spinner } from "../components/ui/Spinner"

import EventsCard from "../components/cameraDetail/EventsCard"
import OverviewCard from "../components/cameraDetail/OverviewCard"
import HealthCard from "../components/cameraDetail/HealthCard"
import InfoCard from "../components/cameraDetail/InfoCard"
import CameraPlayer from "../components/cameraDetail/CameraPlayer"
import CameraActionsMenu from "../components/cameras/CamerasActionsMenu"

import useCameraDelete from "../hooks/useCameraDelete"
import CameraDeleteModal from "../components/modals/CameraDeleteModal"

import StatusDot from "../components/ui/StatusDot"

import useResource from "../hooks/useResource"


export default function CameraDetailPage() {
    const navigate = useNavigate()

    const { cameraId } = useParams()

    const camera = useResource(['camera', cameraId], (o) => getOneCamera(cameraId, o))
    const health = useResource(['health', cameraId], (o) => getHealthCheck(cameraId, o))
    const stream = useResource(['stream', cameraId], (o) => getStreamURL(cameraId, o))

    const [ activeTab, setActiveTab ] = useState("overview")

    const [ testing, setTesting ] = useState(false)
    const [ testResult, setTestResult ] = useState(null)

    const dismissTimer = useRef(null)

    useEffect(() => {
        return () => clearTimeout(dismissTimer.current)
    }, [])


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


    const headerStatus = !camera.data?.enabled ? "disabled" : health.data?.status ?? "unknown"

    const isRecording = camera.data?.recording_enabled


    async function testCameraConnection() {
        setTesting(true)
        setTestResult(null)

        try {
            const test_res = await testCamera(cameraId)

            setTestResult({
                success: test_res.status === "online",
                message: test_res.message || "Camera connection successful.",
            })

            health.reload()


        } catch (error) {
            console.error("Failed to test camera:", error)

            setTestResult({
                success: false,
                message: "Failed to connect to camera.",
            })
        } finally {
            setTesting(false)
            clearTimeout(dismissTimer.current)
            dismissTimer.current = setTimeout(() => setTestResult(null), 5000)
        }
    }

    if (camera.loading) {
        return <Spinner />
    }

    if (camera.error) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
                <p className="text-sm font-medium text-[#F8FAFC]">Couldn't load this camera</p>
                <p className="text-sm text-[#94A3B8]">{camera.error}</p>
                <NavLink to="/cameras" className="rounded-md bg-[#3B82F6] px-4 py-2 text-sm hover:bg-[#2563EB]">
                    Back to cameras
                </NavLink>
            </div>
        )
    }

    return (
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col gap-4">

            <div className="flex justify-between">
                <h2 className="text-xl font-semibold">{camera.data?.name}</h2>
                <CameraActionsMenu 
                    cameraId={cameraId}
                    onDelete={() => requestDelete(camera.data)}
                />
            </div>

            <div className="flex gap-3 items-center">
                <div className="text-sm text-[#CBD5E1]">{camera.data?.location}</div>

                <StatusDot status={headerStatus} showLabel={true} />
                
                {isRecording && (
                    <div className="flex items-center gap-1 text-[#FB923C]">
                        <div className="h-2 w-2 rounded-full bg-orange-400" />
                        <span className="text-sm">Recording</span>
                    </div>
                )}
            </div>

            <div className="rounded-md aspect-video w-4/5 mx-auto">
                <CameraPlayer 
                    camera={camera.data}
                    streamURL={stream.data?.main_stream_url}
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

            {activeTab === "overview" && <OverviewCard camera={camera.data} lastSeen={health.data?.last_frame_at}/>}
            {activeTab === "info" && <InfoCard camera={camera.data} />}
            {activeTab === "health" && <HealthCard health={health.data} loading={health.loading} error={health.error}/>}
            {activeTab === "events" && <EventsCard camera={camera.data} />}

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
                        className="px-4 py-3 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3B82F6]"
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