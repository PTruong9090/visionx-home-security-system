

export default function CameraCard({name, location, status}) {
    return (
        <div className="rounded-2xl border border-[#24313C] bg-[#111820]">
            <div className="aspect-video">

            </div>

            <div className="p-4">
                <p className="text-xs">{name}</p>
                <p className="text-xs">{location}</p>
            </div>
        </div>
    )
}