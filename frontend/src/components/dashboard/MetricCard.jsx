export default function MetricCard({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-[#24313C] bg-[#111820] p-5">
      <div className="flex items-center gap-3">
        <div className="flex bg-[#22C55E] h-7 w-7 items-center justify-center rounded-lg bg-[#16212B]">
          <Icon size={14}/>
        </div>

        <p className="text-xs font-semibold text-[#CBD5E1]">{title}</p>
      </div>

      <p className="mt-3 text-2xl font-bold text-[#F8FAFC]">{value}</p>

      <p className="mt-2 text-xs text-[#94A3B8]">{description}</p>
    </div>
  )
}