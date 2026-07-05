import { MoreVertical } from "lucide-react"

export default function CameraCard({name, location, status}) {
    const isOn = status === true

    
    return (
        <div className="rounded-2xl border border-[#24313C] bg-[#111820] overflow-hidden">
            <div className="relative aspect-video bg-[#0B1117]">
                <div className="text-xs absolute left-3 top-3">
                    Live badge here
                </div>
                {/* Video preview goes here */}
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

                <button className="p-1 rounded-md hover:bg-[#1A2530]">
                    <MoreVertical size={16} />
                </button>
                
            </div>
        </div>
    )
}