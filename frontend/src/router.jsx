import { createBrowserRouter, Navigate } from "react-router-dom";

import AddCameraPage from "./pages/AddCameraPage";
import CameraDetailPage from "./pages/CameraDetailPage";
import CamerasPage from "./pages/CamerasPage";
import DashboardPage from "./pages/DashboardPage";
import HealthPage from "./pages/HealthPage";
import LoginPage from "./pages/LoginPage";
import RecordingsPage from "./pages/RecordingsPage";
import SettingsPage from "./pages/SettingsPage";

import AppShell from "./layouts/AppShell";


export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppShell />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />
            },
            {
                path: "dashboard",
                element: <DashboardPage />
            },
            {
                path: "cameras",
                element: <CamerasPage />
            },
            {
                path: "cameras/new",
                element: <CamerasPage />
            },
            {
                path: "cameras/:cameraId",
                element: <CameraDetailPage />
            },
            {
                path: "recordings",
                elements: <RecordingsPage />
            },
            {
                path: "health",
                elements: <HealthPage />
            },
            {
                path: "settings",
                elements: <SettingsPage />
            }
        ]
    }
])