"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js'

// Define the structure of a Trabajador (Worker)
// Adjust this to match your 'trabajadores' table structure
export interface Trabajador {
  id: string // Assuming 'id' is the primary key and is a string (e.g., UUID)
  cedula: string
  telefono: string
  // Add other fields from your 'trabajadores' table here
  // e.g., nombre?: string, apellido?: string, email?: string
  // Supabase typically adds an 'email' field to its auth.users table if you use its own auth
  // but since we are querying 'trabajadores', the structure depends on that table.
  // For simplicity, I'll assume your 'trabajadores' table might have an email,
  // if not, you can remove or adjust it.
  email?: string; // Optional: if your 'trabajadores' table has an email.
}

interface AuthContextType {
  user: Trabajador | null // User can be a Trabajador or null
  signIn: (cedula: string, telefono: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  loading: boolean
  // session: SupabaseSession | null // We might not need to expose the raw Supabase session directly
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// !!! IMPORTANT: Move these to .env.local files for security !!!
const supabaseUrl = 'https://wilmzlaieqfmhlnzrgiz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbG16bGFpZXFmbWhsbnpyZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTgwNjksImV4cCI6MjA1OTYzNDA2OX0.qDya2K_qa_k7XXoa6ey_0X1bqxOyT6pEbndtpOTFYT4'

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Clave para almacenar la sesión en localStorage
const LOCAL_STORAGE_KEY = 'zapateria_user_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Trabajador | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para guardar el usuario en localStorage
  const saveUserToLocalStorage = (userData: Trabajador) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData))
    }
  }

  // Función para obtener el usuario de localStorage
  const getUserFromLocalStorage = (): Trabajador | null => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY)
      return savedUser ? JSON.parse(savedUser) : null
    }
    return null
  }

  // Función para eliminar el usuario de localStorage
  const removeUserFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }

  useEffect(() => {
    setLoading(true)
    
    // Primero, intentar restaurar la sesión desde localStorage
    const savedUser = getUserFromLocalStorage()
    if (savedUser) {
      setUser(savedUser)
      setLoading(false)
    }
    
    // Listen for changes to authentication state
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Esta parte sigue siendo útil para el signOut estándar de Supabase
      if (!session) {
        setUser(null)
        removeUserFromLocalStorage()
      }
      
      if (!savedUser) {
        setLoading(false)
      }
    })

    return () => {
      authSubscription?.unsubscribe()
    }
  }, [])

  const signIn = async (cedula: string, telefono: string) => {
    setLoading(true)
    setError(null) // This is for the context's own error state, not directly the form's.

    if (!cedula || !telefono) {
      setLoading(false)
      return { error: new Error("Cédula y teléfono son requeridos") }
    }

    try {
      const { data, error: queryError } = await supabase
        .from('trabajadores')
        .select('*') 
        .eq('cedula', cedula)
        .eq('telefono', telefono)
        .single()

      if (queryError) {
        setLoading(false) // Ensure loading is set to false on query error
        if (queryError.code === 'PGRST116' || queryError.message.includes("JSON object requested, multiple (or no) rows returned")) {
            return { error: new Error("Cédula o teléfono incorrectos.") }
        }
        return { error: queryError } // Return the actual Supabase error for other cases
      }

      if (data) {
        // Guardar en el estado y en localStorage
        setUser(data as Trabajador)
        saveUserToLocalStorage(data as Trabajador)
        setLoading(false)
        return { error: null }
      } else {
        // This case should ideally be caught by the .single() queryError if no rows are found (PGRST116).
        // However, as a fallback:
        setLoading(false)
        return { error: new Error("Cédula o teléfono incorrectos (inesperado).") } // Slightly different message for clarity
      }
    } catch (e: any) {
      setLoading(false)
      return { error: new Error(e.message || "Error al iniciar sesión") }
    }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setUser(null)
    removeUserFromLocalStorage() // Eliminar la sesión del localStorage
    setLoading(false)
    if (error) {
      console.error("Error signing out:", error)
      // Potentially return error or handle it
    }
  }

  // Need to define setError for the signIn function
  // This was missing in the transformation but present in the original context idea for login form
  const [error, setError] = useState<string | null>(null);


  return <AuthContext.Provider value={{ user, signIn, signOut, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
