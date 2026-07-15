import CamerasActionsMenu from "./CamerasActionsMenu"

import { useState, useEffect } from "react"

import { getStreamURL } from "../../api/cameraAPI"

import CameraPlayer from "../cameraDetail/CameraPlayer"

export default function CameraCard({camera, name, location, status, onDelete}) {
    const isOn = status === true
    const [streamInfo, setStreamInfo] = useState(null)

    useEffect(() => {
        async function fetchStreamData() {
            try {
                const res = await getStreamURL(camera.id)
                setStreamInfo(res)
            } catch (error) {
                console.error("Failed to fetch stream data", error)
            }
        }

        fetchStreamData()
    }, [camera.id])
    
    return (
        <div className="rounded-2xl border border-[#24313C] bg-[#111820]">
            <div className="rounded-2xl relative aspect-video bg-[#0B1117]">
                <CameraPlayer
                    camera={camera}
                    streamURL={streamInfo?.sub_stream_url}
                />
            </div>

            <div className="flex justify-between items-start p-4">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold flex gap-1 items-center">
                        {name}
                    </p>

                    <div className="flex gap-1 items-center">
                        <div className={`w-3 h-3 rounded-full ${isOn ? "bg-green-500" : "bg-red-500"}`} />

                        <p className="text-xs text-[#CBD5E1]">{location}</p>
                    </div>
                </div>

                <CamerasActionsMenu 
                    cameraId={camera.id}
                    onDelete={onDelete}
                />
                
            </div>
        </div>
    )
}