"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"

export default function LoginForm() {
  const [cedula, setCedula] = useState("")
  const [telefono, setTelefono] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, loading } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const { error: signInError } = await signIn(cedula, telefono)

      if (signInError) {
        throw signInError
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con cédula/teléfono")
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="cedula">Cédula</Label>
        <Input
          id="cedula"
          type="text"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          placeholder="Número de cédula"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Número de teléfono"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  )
}
