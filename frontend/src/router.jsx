import { createBrowserRouter, Navigate } from "react-router-dom";

import AddCameraPage from "./pages/AddCameraPage";
import CameraDetailPage from "./pages/CameraDetailPage";
import CamerasPage from "./pages/CamerasPage";
import DashboardPage from "./pages/DashboardPage";
import HealthPage from "./pages/HealthPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import RecordingsPage from "./pages/RecordingsPage";
import SettingsPage from "./pages/SettingsPage";
import EditCameraPage from "./pages/EditCameraPage";

import AppShell from "./layouts/AppShell";


export const router = createBrowserRouter([
    {
        path: "login",
        element: <LoginPage />
    },
    {
        path: "signup",
        element: <SignupPage />
    },
    {
        path: "forgot-password",
        element: <ForgotPasswordPage />
    },
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
                element: <AddCameraPage />
            },
            {
                path: "cameras/:cameraId/edit",
                element: <EditCameraPage />
            },
            {
                path: "cameras/:cameraId",
                element: <CameraDetailPage />
            },
            {
                path: "recordings",
                element: <RecordingsPage />
            },
            {
                path: "health",
                element: <HealthPage />
            },
            {
                path: "settings",
                element: <SettingsPage />
            }
        ]
    }
])