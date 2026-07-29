

export default function OverviewCard({camera}) {
    return (
        <div className="mt-6 grid max-w-2xl grid-cols-[120px_1fr] gap-y-4 text-sm">
            <p className="text-[#94A3B8]">Stream Key</p>
            <p className="text-[#F8FAFC]">{camera.stream_key}</p>

            <p className="text-[#94A3B8]">Enabled</p>
            <p className={`${camera.enabled ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{camera.enabled ? "Enabled" : "Disabled"}</p>

            <p className="text-[#94A3B8]">Last Seen</p>
            <p className="text-[#F8FAFC]">2 minutes ago</p>

            <p className="text-[#94A3B8]">Recording</p>
            <p className="text-[#F8FAFC]">
                {camera.recording_enabled ? "Enabled" : "Disabled"}
            </p>
        </div>
    )
}