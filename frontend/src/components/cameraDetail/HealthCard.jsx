import { formatRelativeTime, formatAbsoluteTime } from "../../utils/time"

import StatusDot from "../ui/StatusDot"


function TimeValue({ value, emptyText }) {
    const relative = formatRelativeTime(value)

    if (!relative) {
        return <span className="text-[#64748B]">{emptyText}</span>
    }

    return <span title={formatAbsoluteTime(value)}>{relative}</span>
}


export default function HealthCard({ health }) {
    if (!health) {
        return <p className="mt-6 text-sm text-[#94A3B8]">No health checks yet.</p>
    }


    return (
        <div className="mt-6 grid max-w-2xl grid-cols-[120px_1fr] gap-y-4 text-sm">
            <p className="text-[#94A3B8]">Status</p>
            <StatusDot status={health.status} showLabel={true}/>

            <p className="text-[#94A3B8]">Latency</p>
            <p className="text-[#F8FAFC] tabular-nums">
                {typeof health.latency_ms === "number"
                    ? `${health.latency_ms} ms`
                    : <span className="text-[#64748B]">-</span>}
            </p>

            <p className="text-[#94A3B8]">Last Frame</p>
            <p className="text-[#F8FAFC]">
                <TimeValue value={health.last_frame_at} emptyText="No frame received" />
            </p>

            <p className="text-[#94A3B8]">Last Recording</p>
            <p className="text-[#F8FAFC]">
                <TimeValue value={health.last_recording_at} emptyText="No recordings yet" />
            </p>

            <p className="text-[#94A3B8]">Checked</p>
            <p className="text-[#F8FAFC]">
                <TimeValue value={health.checked_at} emptyText="Never" />
            </p>

            {health.message && health.status !== "online" && (
                <>
                    <p className="text-[#94A3B8]">Message</p>
                    <p className="text-[#F8FAFC]">{health.message}</p>
                </>
            )}
        </div>
    )
}
