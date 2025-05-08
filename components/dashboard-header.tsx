"use client"

import { useRouter } from "next/navigation"
import { LogOut, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Trabajador } from "@/context/auth-context"

interface DashboardHeaderProps {
  user: Trabajador
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Sistema de Producción de Zapatos</h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon size={16} />
            <span>Cédula: {user.cedula} | Teléfono: {user.telefono}</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut size={16} className="mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  )
}
