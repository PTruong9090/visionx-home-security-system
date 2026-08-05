import { useState } from "react"
import { deleteCamera } from "../api/cameraAPI"
import { messageForError } from "../api/errorMessage"

export default function useCameraDelete({ onDeleted } = {}) {
    const [ cameraToDelete, setCameraToDelete ] = useState(null)
    const [ isDeleting, setIsDeleting ] = useState(false)
    const [ deleteError, setDeleteError ] = useState("")

    function requestDelete(camera) {
        setDeleteError("")
        setCameraToDelete(camera)
    }

    function cancelDelete() {
        setDeleteError("")
        setCameraToDelete(null)
    }

    async function confirmDelete() {
        if (!cameraToDelete) return
        setDeleteError("")

        try {
            setIsDeleting(true)

            await deleteCamera(cameraToDelete.id)
            
            if (onDeleted) {
                onDeleted(cameraToDelete)
            }

            setCameraToDelete(null)

        } catch (err) {
            console.error("Failed to delete camera:", err)
            setDeleteError(messageForError(err))

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
        deleteError,
    }

} 