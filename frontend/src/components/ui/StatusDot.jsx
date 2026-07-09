

export default function StatusDot({ active }) {
    return (
        <div
            className={`h-3 w-3 rounded-full ${
                active ? "bg-green-500" : "bg-red-500"
            }`}
        />
    )
}