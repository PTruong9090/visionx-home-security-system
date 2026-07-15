import { useState } from "react"

import { createCamera } from "../api/cameraAPI"
import { useNavigate } from "react-router-dom"

export default function AddCameraPage() {
    const navigate = useNavigate()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        rtsp_main_url: "",
        rtsp_sub_url: "",
        stream_key: "",
        enabled: true,
        recording_enabled: true,
        health_check_enabled: true,
    })

    function handleChange(e) {
        const { name, value, type, checked} = e.target

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        
        try {
            const res = await createCamera(formData)
            console.log("Created camera:", res)
            navigate("/cameras")

        } catch (error) {
            console.error("Failed to create new camera:", error)
        }

    }
    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Add Camera</h2>
                <p className="text-sm text-[#CBD5E1]">Register a new RTSP camera stream</p>
            </div>

            <div className="mx-auto flex w-full max-w-3xl flex-col">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5 rounded-2xl border border-[#24313C] bg-[#111820] p-6"
                >
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-medium">Camera Name</label>
                        <input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Front Door"
                            className="h-10 rounded-lg border border-[#24313C] bg-[#0F1720] px-3 text-sm outline-none focus:border-[#3B82F6]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="location" className="text-sm font-medium">Location</label>
                        <input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Porch"
                            className="h-10 rounded-lg border border-[#24313C] bg-[#0F1720] px-3 text-sm outline-none focus:border-[#3B82F6]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="rtsp_main_url" className="text-sm font-medium">RTSP Main URL</label>
                        <input
                            id="rtsp_main_url"
                            name="rtsp_main_url"
                            value={formData.rtsp_main_url}
                            onChange={handleChange}
                            placeholder="rtsp://user:pass@192.168.1.50:554/stream1"
                            className="h-10 rounded-lg border border-[#24313C] bg-[#0F1720] px-3 text-sm outline-none focus:border-[#3B82F6]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="rtsp_sub_url" className="text-sm font-medium">RTSP Sub URL</label>
                        <input
                            id="rtsp_sub_url"
                            name="rtsp_sub_url"
                            value={formData.rtsp_sub_url}
                            onChange={handleChange}
                            placeholder="rtsp://user:pass@192.168.1.50:554/stream2"
                            className="h-10 rounded-lg border border-[#24313C] bg-[#0F1720] px-3 text-sm outline-none focus:border-[#3B82F6]"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm">
                        <input
                        type="checkbox"
                        name="enabled"
                        checked={formData.enabled}
                        onChange={handleChange}
                        />
                        Enabled
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                        type="checkbox"
                        name="recording_enabled"
                        checked={formData.recording_enabled}
                        onChange={handleChange}
                        />
                        Recording
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                        type="checkbox"
                        name="health_check_enabled"
                        checked={formData.health_check_enabled}
                        onChange={handleChange}
                        />
                        Health Check Enabled
                    </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/cameras")}
                            className="rounded-lg border border-[#24313C] px-4 py-2 text-sm text-[#CBD5E1] hover:bg-[#16212B]"
                        >
                            Cancel
                        </button>
        
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563EB]"
                        >
                            {isSubmitting ? "Saving..." : "Save Camera"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}