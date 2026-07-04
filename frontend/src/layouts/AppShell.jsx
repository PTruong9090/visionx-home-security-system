import { Outlet } from "react-router-dom"

import Sidebar from "../components/layout/Sidebar"

export default function AppShell() {
  return (
    <div className="flex flex-row min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}