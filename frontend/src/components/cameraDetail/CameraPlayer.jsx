
import { Video } from "lucide-react"


export default function CameraPlayer({ camera }) {
  const isOnline = camera.enabled

  return (
    <div className="overflow-hidden rounded-2xl border border-[#24313C] bg-black">
      <div className="relative aspect-video bg-[#0B1117]">
        <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isOnline ? "bg-[#22C55E]" : "bg-[#EF4444]"
              }`}
            />
            <span className={isOnline ? "text-[#22C55E]" : "text-[#EF4444]"}>
              {isOnline ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 h-full items-center justify-center text-sm text-[#64748B]">
          <Video size={40} />
          <p className="text-sm">Live stream preview</p>
        </div>
      </div>
    </div>
  )
}