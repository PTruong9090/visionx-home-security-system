import { useState } from "react"
import { deleteCamera } from "../api/cameraAPI"

export default function useCameraDelete({ onDeleted } = {}) {
    const [cameraToDelete, setCameraToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(null)

    function requestDelete(camera) {
        setCameraToDelete(camera)
    }

    function cancelDelete() {
        setCameraToDelete(null)
    }

    async function confirmDelete() {
        if (!cameraToDelete) return

        try {
            setIsDeleting(true)

            await deleteCamera(cameraToDelete.id)
            
            if (onDeleted) {
                onDeleted(cameraToDelete)
            }

            setCameraToDelete(null)

        } catch (error) {
            console.error("Failed to delete camera:", error)

        } finally {
            setIsDeleting(false)
        }
    }

    return {
        cameraToDelete,
        isDeleting,
        requestDelete,
        cancelDelete,
        confirmDelete,
    }

} 