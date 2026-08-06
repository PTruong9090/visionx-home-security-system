
const STATUS_STYLES = {
    online: { label: "Online", text: "text-[#22C55E]", dot: "bg-[#22C55E]" },
    degraded: { label: "Degraded", text: "text-[#F59E0B]", dot: "bg-[#F59E0B]" },
    offline: { label: "Offline", text: "text-[#EF4444]", dot: "bg-[#EF4444]" },
    enabled: { label: "Enabled", text: "text-[#22C55E]", dot: "bg-[#22C55E]"},
    disabled: { label: "Disabled", text: "text-[#64748B]", dot: "bg-[#64748B]" },
    unknown: { label: "Unknown", text: "text-[#64748B]", dot: "bg-[#64748B]" },
}


export default function StatusDot({ status, showLabel = false }) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown

    return (
        <span className={`inline-flex items-center gap-1 ${style.text}`} role="status">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
            {showLabel && <span className="text-sm">{style.label}</span>}
        </span>
    )
}
