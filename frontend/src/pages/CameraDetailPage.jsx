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


export default function CameraDetailPage() {
    const navigate = useNavigate()

    const [ loading, setLoading ] = useState(true)

    const [ camera, setCamera ] = useState(null)
    const { cameraId } = useParams()
    const [ cameraLoadError, setCameraLoadError ] = useState(null)

    const [ activeTab, setActiveTab ] = useState("overview")

    const [ testing, setTesting ] = useState(false)
    const [ testResult, setTestResult ] = useState(null)
    const [ streamInfo, setStreamInfo ] = useState(null)

    const [ health, setHealth ] = useState(null)

    const requestSeq = useRef(0)
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


    const headerStatus = !camera?.enabled ? "disabled" : health?.status ?? "unknown"

    const isRecording = camera?.recording_enabled


    async function testCameraConnection() {
        setTesting(true)
        setTestResult(null)


        try {
            const test_res = await testCamera(cameraId)

            setTestResult({
                success: test_res.status === "online",
                message: test_res.message || "Camera connection successful.",
            })

            setHealth(test_res)


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


    useEffect(() => {
        const controller = new AbortController()
        const seq = ++requestSeq.current

        async function fetchCameraData() {
            setLoading(true)
            setCameraLoadError(null)

            const [cameraResponse, healthResponse, streamResponse] = await Promise.allSettled([
                getOneCamera(cameraId, {signal: controller.signal} ),
                getHealthCheck(cameraId, {signal: controller.signal} ),
                getStreamURL(cameraId, {signal: controller.signal} ),
            ])

            if (seq !== requestSeq.current) return

            if (controller.signal.aborted) return

            if (cameraResponse.status === "fulfilled") {
                setCamera(cameraResponse.value)
            } else {
                setCameraLoadError(cameraResponse.reason?.message ?? "Failed to load camera")
            }

            if (healthResponse.status === "fulfilled") {
                setHealth(healthResponse.value)
            }

            if (streamResponse.status === "fulfilled") {
                setStreamInfo(streamResponse.value)
            }

            setLoading(false)
            
        }

        fetchCameraData()

        return () => controller.abort()
    }, [cameraId])

    if (cameraLoadError) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
            <p className="text-sm font-medium text-[#F8FAFC]">Couldn't load this camera</p>
            <p className="text-sm text-[#94A3B8]">{cameraLoadError}</p>
            <NavLink to="/cameras" className="rounded-md bg-[#3B82F6] px-4 py-2 text-sm hover:bg-[#2563EB]">
                Back to cameras
            </NavLink>
        </div>
    )
}

    if (loading) {
        return <Spinner />
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
                    camera={camera}
                    streamURL={streamInfo?.main_stream_url}
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
            {activeTab === "health" && <HealthCard health={health} />}
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