import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"

import { getCameras } from "../api/cameraAPI"
import { deleteCamera } from "../api/cameraAPI"

import { Plus, Trash } from "lucide-react"

import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal"



export default function CamerasPage() {
    const [cameras, setCameras] = useState([])
    const [cameraToDelete, setCameraToDelete] = useState(null)

    async function fetchCameras() {
        try {
            const res = await getCameras()
            setCameras(res)

        } catch (error) {
            console.error("Failed to fetch cameras:", error)
        }
    }

    async function handleDeleteCamera(cameraId) {
        try {
            await deleteCamera(cameraId)
            setCameras(prevCameras => 
                prevCameras.filter(camera => camera.id !== cameraId)
            )

        } catch (error) {
            console.error("Failed to delete camera:", error)
        }
    }

    useEffect(() => {
        fetchCameras()
    }, [])


    return (
        <div className="flex flex-col gap-8">

            <div className="flex flex-row justify-between items-center">

                <div className="flex flex-col justify-center gap-1">
                    <h2 className="text-xl font-semibold">Cameras</h2>
                    <p className="text-sm text-[#CBD5E1]">Manage your camera streams</p>
                </div>
                <NavLink to="/cameras/new" className="flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium hover:bg-[#2563EB]">
                    <Plus size={16} />
                    Add Camera
                </NavLink>
            
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#24313C] bg-[#111820]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#0F1720] text-s text-[#94A3B8]"> 
                        <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Location</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Recording</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cameras.map((camera) => (
                            <tr
                                key={camera.id}
                                className="border-t border-[#1B2731] hover:bg-[#162128]"
                            >
                                <td className="px-4 py-4 font-medium text-[#F8FAFC]">
                                    {camera.name}
                                </td>
                                    
                                <td className="p-4 text-[#CBD5E1]">
                                    {camera.location}
                                </td>

                                <td className="p-4">
                                    {camera.enabled ? "Enabled" : "Disabled"}
                                </td>

                                <td className="p-4">
                                    {camera.recording_enabled ? "On" : "Off"}
                                </td>

                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <NavLink 
                                            to={`/cameras/${camera.id}`}
                                            className="rounded-lg border border-[#24313C] px-3 py-1 text-xs text-[#CBD5E1] hover:bg-[#16212B]">
                                            View
                                        </NavLink>

                                        <NavLink to={`/cameras/${camera.id}/edit`} className="rounded-lg border border-[#24313C] px-3 py-1 text-xs text-[#CBD5E1] hover:bg-[#16212B]">
                                            Edit
                                        </NavLink>

                                        <button
                                            onClick={() => setCameraToDelete(camera)}
                                            className="rounded-lg border border-[#24313C] px-1 py-1 text-xs text-[#CBD5E1] hover:bg-[#16212B]"
                                        >
                                            <Trash size={18}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {cameraToDelete && (
                    <ConfirmDeleteModal
                        cameraName={cameraToDelete.name}
                        onCancel={() => setCameraToDelete(null)}
                        onConfirm={async () => {
                            await handleDeleteCamera(cameraToDelete.id)
                            setCameraToDelete(null)
                        }}
                    />
                )}

            </div>
        </div>
    )
}