

export default function ConfirmDeleteModal({ cameraName, onCancel, onConfirm }) {
    return (
        <div 
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border border-[#24313C] bg-[#111820] shadow-xl p-6">

                <h3 className="text-lg font-semibold text-[#F8FAFC]">Delete camera?</h3>

                <p className="mt-2 text-sm text-[#CBD5E1]">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-[#F8FAFC]">
                        {cameraName}
                    </span>
                    ? This action cannot be undone.
                </p>

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-[#24313C] px-4 py-2 text-sm text-[#CBD5E1] hover:bg-[#16212B]"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Delete
                    </button>

                </div>

            </div>
        </div>
    )
}