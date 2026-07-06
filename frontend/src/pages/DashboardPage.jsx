import { Bell, MoveRight, Video, HardDrive, Radio } from "lucide-react"

import { NavLink } from "react-router-dom"
import { useState, useEffect } from "react"

import { getCameras } from "../api/cameraAPI"

import MetricCard from "../components/dashboard/MetricCard"
import CameraCard from "../components/cameras/CameraCard"
import RecentActivityPanel from "../components/dashboard/RecentActivityPanel"


export default function DashboardPage() {
    const [cameras, setCameras] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const totalCameras = cameras.length
    const enabledCameras = cameras.filter((camera) => camera.enabled).length

    useEffect(() => {
        async function getAllCameras() {
            try {
                const res = await getCameras()
                setCameras(res)

            } catch (error) {
                console.error("Failed to fetch cameras:", error)
            }
        }

        getAllCameras()

    }, [])

    return (
        <div className="flex flex-col gap-6">

            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                    <h1 className="font-semibold text-xl">Dashboard</h1>
                    <p className="text-s text-[#CBD5E1]">Overview of your security system</p>
                </div>

                <div className="flex flex-row gap-10 items-center">
                    <p className="text-xs">System Online</p>

                    <Bell size={18}/>
                    
                </div>

            </div>

            <div className="grid gap-5 grid-cols-4">
                <MetricCard
                icon={Video}
                title="Cameras Online"
                value={`${enabledCameras} / ${totalCameras}`}
                description={`${enabledCameras/totalCameras * 100}% cameras online`}
                />

                <MetricCard
                icon={Radio}
                title="Recording"
                value="6"
                description="Cameras recording"
                />

                <MetricCard
                icon={HardDrive}
                title="Storage Used"
                value="2.45 TB"
                description="of 8 TB used"
                />

                <MetricCard
                icon={Bell}
                title="Events 24h"
                value="18"
                description="View all events"
                />
            </div>

            <div className="flex flex-row gap-5">

                <div className="flex flex-1 flex-col gap-4">
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="font-semibold">Live Cameras</h2>
                        <NavLink to="/cameras" className='flex flex-row text-xs text-[#3B82F6] gap-2 items-center'>View all Cameras <MoveRight size={12}/></NavLink>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        {cameras.length === 0 ? (
                            <div>
                                <p>No cameras added yet.</p>
                                <p>Add your first RTSP camera to start monitoring.</p>
                            </div>
                        ) : (
                            cameras.slice(0, 6).map((camera) => (
                                <CameraCard
                                    key={camera.id}
                                    name={camera.name}
                                    location={camera.location}
                                    status={camera.enabled}
                                />
                            ))
                        )
                            
                        }
                    </div>
                </div>

                <div className="w-1/3">
                    <RecentActivityPanel />
                </div>

            </div>

        </div>
    )
}