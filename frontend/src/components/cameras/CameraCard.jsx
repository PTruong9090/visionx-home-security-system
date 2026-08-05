import CamerasActionsMenu from "./CamerasActionsMenu"

import { getStreamURL } from "../../api/cameraAPI"

import CameraPlayer from "../cameraDetail/CameraPlayer"

import StatusDot from "../ui/StatusDot"

import useResource from "../../hooks/useResource"

export default function CameraCard({camera, name, location, onDelete}) {
    const stream = useResource(["stream", camera.id], (o) => getStreamURL(camera.id, o), {enabled: camera.enabled === true})

    
    return (
        <div className="rounded-2xl border border-[#24313C] bg-[#111820]">
            <div className="rounded-2xl relative aspect-video bg-[#0B1117]">
                <CameraPlayer
                    camera={camera}
                    streamURL={stream.data?.sub_stream_url}
                />
            </div>

            <div className="flex justify-between items-start p-4">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold flex gap-1 items-center">
                        {name}
                    </p>

                    <div className="flex gap-1 items-center">
                        <StatusDot status={camera.enabled ? "enabled" : "disabled"}/>

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