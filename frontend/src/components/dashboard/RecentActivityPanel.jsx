

export default function RecentActivityPanel() {
    return (
        <div className="bg-[#111820] border border-[#24313C] rounded-2xl p-5">
            <h2 className="font-semibold">Recent Activity</h2>

            <div className="mt-4 flex flex-col gap-3">
                {/* Insert activity cards */}
                <div className="rounded-xl border border-[#1B2731] bg-[#0F1720] p-3">
                    <p className="text-sm font-medium">Front Door online</p>
                    <p className="text-xs text-[#94A3B8]">Just now</p>
                </div>

                <div className="rounded-xl border border-[#1B2731] bg-[#0F1720] p-3">
                    <p className="text-sm font-medium">Recording started</p>
                    <p className="text-xs text-[#94A3B8]">5 minutes ago</p>
                </div>

                <div className="rounded-xl border border-[#1B2731] bg-[#0F1720] p-3">
                    <p className="text-sm font-medium">Garage offline</p>
                    <p className="text-xs text-[#94A3B8]">12 minutes ago</p>
                </div>
            </div>
        </div>
    )
}