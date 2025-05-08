"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import { useAuth } from "@/context/auth-context"
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, Play, Square, Check, Trophy } from "lucide-react"

// Inicializar cliente Supabase (idealmente esto debería estar en un archivo separado)
const supabaseUrl = 'https://wilmzlaieqfmhlnzrgiz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbG16bGFpZXFmbWhsbnpyZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTgwNjksImV4cCI6MjA1OTYzNDA2OX0.qDya2K_qa_k7XXoa6ey_0X1bqxOyT6pEbndtpOTFYT4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipo para las tareas de producción según la estructura real del query SQL
interface TareaProduccion {
  id: number
  venta_id: number
  numero_producto: number
  producto_id: number
  paso_id: number
  nombre_paso: string
  descripcion: string
  duracion_estimada: string
  rol_requerido: string
  trabajador_id: number | string
  estado: string
  fecha_asignacion: string
  fecha_inicio: string | null
  fecha_fin: string | null
  timer: string | null
  orden_ejecucion: number
  fecha_entrega: string
  nombre_producto: string | null  // Nombre del producto de productos_table
  tallas: string | null  // Tallas de la venta
  colores: string | null  // Colores de la venta
  cliente_id: number
  nombre: string
  apellido: string
  telefono: string
  // Campos adicionales con todos los datos completos
  paso_data?: any
  venta_data?: any
  trabajador_data?: any
  producto_data?: any
}

// Función para formatear el tiempo en formato mm:ss
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tareas, setTareas] = useState<TareaProduccion[]>([])
  const [loadingTareas, setLoadingTareas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [updatingTask, setUpdatingTask] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [allTasksCompleted, setAllTasksCompleted] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [newTasksAdded, setNewTasksAdded] = useState(false)
  const [newTaskCount, setNewTaskCount] = useState(0)
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  // Función para cargar tareas (extraída para reutilización)
  const fetchTareas = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoadingTareas(true);
      
      // Simplificamos la consulta para evitar errores
      const { data, error } = await supabase
        .from('tareas_produccion')
        .select(`
          *,
          pasos_produccion:paso_id(
            nombre_paso,
            descripcion,
            duracion_estimada,
            rol_requerido,
            orden_ejecucion
          ),
          ventas:venta_id(
            fecha_entrega,
            tallas,
            colores,
            cliente_id
          ),
          trabajadores:trabajador_id(
            nombre,
            apellido,
            telefono
          ),
          productos:producto_id(
            nombre
          )
        `)
        .eq('trabajador_id', user.id)
        .eq('estado', 'Pendiente');
      
      if (error) throw error;
      
      console.log("Datos obtenidos:", data);
      
      if (data && data.length > 0) {
        const tareasFormateadas = data.map(item => ({
          // Datos de tareas_produccion
          id: item.id,
          venta_id: item.venta_id,
          numero_producto: item.numero_producto || 0,
          producto_id: item.producto_id,
          paso_id: item.paso_id,
          trabajador_id: item.trabajador_id,
          estado: item.estado || 'Pendiente',
          fecha_asignacion: item.fecha_asignacion,
          fecha_inicio: item.fecha_inicio,
          fecha_fin: item.fecha_fin,
          timer: item.timer,
          
          // Datos de pasos_produccion
          nombre_paso: item.pasos_produccion?.nombre_paso || '',
          descripcion: item.pasos_produccion?.descripcion || '',
          duracion_estimada: item.pasos_produccion?.duracion_estimada || '',
          rol_requerido: item.pasos_produccion?.rol_requerido || '',
          orden_ejecucion: item.pasos_produccion?.orden_ejecucion || 0,
          
          // Datos de ventas
          fecha_entrega: item.ventas?.fecha_entrega || '',
          tallas: item.ventas?.tallas || '',
          colores: item.ventas?.colores || '',
          cliente_id: item.ventas?.cliente_id || 0,
          
          // Datos de trabajadores
          nombre: item.trabajadores?.nombre || '',
          apellido: item.trabajadores?.apellido || '',
          telefono: item.trabajadores?.telefono || '',
          
          // Datos de productos
          nombre_producto: item.productos?.nombre || 'No especificado',
          
          // Datos completos para referencia
          paso_data: item.pasos_produccion,
          venta_data: item.ventas,
          trabajador_data: item.trabajadores,
          producto_data: item.productos
        }));
        
        // Ordenamos las tareas por ID (de menor a mayor)
        tareasFormateadas.sort((a, b) => a.id - b.id);
        
        // Verificar si hay tareas nuevas comparando IDs
        const existingTaskIds = tareas.map(t => t.id);
        const newTasks = tareasFormateadas.filter(t => !existingTaskIds.includes(t.id));
        
        // Solo mostrar notificación si no es la carga inicial y hay tareas nuevas
        if (newTasks.length > 0 && !isInitialLoadRef.current) {
          setNewTaskCount(newTasks.length);
          setNewTasksAdded(true);
          // Auto-ocultar la notificación después de 5 segundos
          setTimeout(() => {
            setNewTasksAdded(false);
          }, 5000);
        }
        
        setTareas(tareasFormateadas);
        
        // Verificar si hay tareas pendientes para actualizar allTasksCompleted
        setAllTasksCompleted(tareasFormateadas.length === 0 || tareasFormateadas.every(t => t.estado === 'Completado'));
      } else {
        // Si no hay resultados, mostrar una lista vacía
        setTareas([]);
        setAllTasksCompleted(true);
      }
    } catch (err: any) {
      console.error("Error al cargar tareas:", err);
      setError(err.message || "Error al cargar tareas");
    } finally {
      setLoadingTareas(false);
      // Actualizar bandera después de completar la carga inicial
      isInitialLoadRef.current = false;
    }
  };

  // Efecto para cargar las tareas inicialmente
  useEffect(() => {
    if (user && user.id) {
      fetchTareas();
    }
  }, [user]);

  // Efecto para el cronómetro
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  // Efecto para verificar si todas las tareas están completadas
  useEffect(() => {
    if (tareas.length > 0) {
      const allCompleted = tareas.every(tarea => tarea.estado === 'Completado');
      setAllTasksCompleted(allCompleted);
      
      // Si acabamos de completar todas las tareas, mostrar la animación
      if (allCompleted && !showAnimation) {
        setShowAnimation(true);
        
        // Opcional: Auto-ocultar la animación después de un tiempo
        setTimeout(() => {
          setShowAnimation(false);
        }, 10000); // 10 segundos
      }
    }
  }, [tareas, showAnimation]);

  const handleStartTask = async () => {
    if (!tareas.length || currentIndex >= tareas.length || isRunning) return;
    
    const currentTarea = tareas[currentIndex];
    const now = new Date().toISOString();
    
    try {
      setUpdatingTask(true);
      
      // Actualizar fecha_inicio en Supabase
      const { error } = await supabase
        .from('tareas_produccion')
        .update({ fecha_inicio: now })
        .eq('id', currentTarea.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const updatedTareas = [...tareas];
      updatedTareas[currentIndex] = {
        ...currentTarea,
        fecha_inicio: now
      };
      
      setTareas(updatedTareas);
      setIsRunning(true);
      setTimer(0);
      
    } catch (err: any) {
      console.error("Error al iniciar tarea:", err);
      setError(err.message || "Error al iniciar tarea");
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleFinishTask = async () => {
    if (!tareas.length || currentIndex >= tareas.length || !isRunning) return;
    
    const currentTarea = tareas[currentIndex];
    const now = new Date().toISOString();
    // Convertir segundos a minutos con decimales
    const timerMinutos = (timer / 60).toFixed(2);
    
    try {
      setUpdatingTask(true);
      
      // Actualizar fecha_fin y timer en Supabase
      const { error } = await supabase
        .from('tareas_produccion')
        .update({ 
          fecha_fin: now,
          timer: timerMinutos,
          estado: 'Completado'
        })
        .eq('id', currentTarea.id);
      
      if (error) throw error;
      
      // Detener cronómetro
      setIsRunning(false);
      
      // Recordar el ID de la tarea que acabamos de completar
      const completedTaskId = currentTarea.id;
      
      // Buscar nuevas tareas después de completar una tarea
      await fetchTareas();
      
      // Después de obtener las nuevas tareas, seleccionar la que tenga el ID menor
      if (tareas.length > 0) {
        // Seleccionar la tarea con el ID más bajo entre las pendientes
        const minIdTask = tareas.reduce((min, current) => 
          (current.id < min.id) ? current : min, tareas[0]);
          
        // Encontrar el índice de esta tarea en el array
        const newIndex = tareas.findIndex(t => t.id === minIdTask.id);
        if (newIndex !== -1) {
          setCurrentIndex(newIndex);
        } else {
          // Si no se encuentra (caso improbable), simplemente usar índice 0
          setCurrentIndex(0);
        }
      }
      
      // Verificar si todas las tareas están completadas para mostrar animación
      const allCompleted = tareas.length === 0 || tareas.every(t => t.estado === 'Completado');
      if (allCompleted) {
        setAllTasksCompleted(true);
        setShowAnimation(true);
        
        // Opcional: Auto-ocultar la animación después de un tiempo
        setTimeout(() => {
          setShowAnimation(false);
        }, 10000); // 10 segundos
      }
      
    } catch (err: any) {
      console.error("Error al finalizar tarea:", err);
      setError(err.message || "Error al finalizar tarea");
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleSkipTask = () => {
    // Solo permitir avanzar si la tarea actual está completada
    if (currentIndex < tareas.length - 1 && tareas[currentIndex].estado === 'Completado') {
      if (isRunning) {
        // Si hay un cronómetro corriendo, detenerlo
        setIsRunning(false);
        setTimer(0);
      }
      
      // Encontrar la siguiente tarea pendiente por orden de ejecución
      const nextTaskIndex = tareas.findIndex((t, i) => 
        i > currentIndex && t.estado === 'Pendiente'
      );
      
      if (nextTaskIndex !== -1) {
        setCurrentIndex(nextTaskIndex);
      }
    } else if (tareas[currentIndex].estado !== 'Completado') {
      // Mostrar un error si se intenta avanzar sin completar
      setError("Debes completar esta tarea antes de avanzar a la siguiente");
      
      // Limpiar el mensaje de error después de 3 segundos
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handlePreviousTask = () => {
    if (currentIndex > 0) {
      if (isRunning) {
        // Si hay un cronómetro corriendo, detenerlo
        setIsRunning(false);
        setTimer(0);
      }
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Animación de tareas completadas */}
      {showAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center animate-bounce">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
              <Check size={48} className="text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-4">¡Todas las tareas completadas!</h2>
            <p className="text-gray-600 mb-6">¡Excelente trabajo! Has terminado todas tus tareas asignadas.</p>
            <div className="flex justify-center">
              <Trophy size={32} className="text-yellow-500 mr-2 animate-bounce" />
              <Trophy size={32} className="text-yellow-500 ml-2 animate-bounce" />
            </div>
            <Button 
              className="mt-6 bg-green-600 hover:bg-green-700" 
              onClick={() => setShowAnimation(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      )}

      {/* Notificación de nuevas tareas */}
      {newTasksAdded && (
        <div className="fixed top-20 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-40 animate-slideIn">
          <div className="flex items-center">
            <div className="mr-3 bg-blue-500 rounded-full p-2">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold">¡Nuevas tareas asignadas!</h3>
              <p className="text-sm">
                {newTaskCount === 1 
                  ? "Se ha agregado 1 nueva tarea de producción" 
                  : `Se han agregado ${newTaskCount} nuevas tareas de producción`}
              </p>
            </div>
            <button 
              className="ml-4 text-white hover:text-blue-200"
              onClick={() => setNewTasksAdded(false)}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>
      )}

      <DashboardHeader user={user} />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Estado de Producción de Zapatos</h1>

        <div className="bg-white rounded-lg shadow p-6">
          {loadingTareas ? (
            <div className="text-center py-8">Cargando tareas...</div>
          ) : error ? (
            <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
              Error: {error}
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tienes tareas pendientes asignadas actualmente.
            </div>
          ) : allTasksCompleted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">¡Todas las tareas completadas!</h2>
              <p className="text-gray-600">Has completado todas tus tareas asignadas. ¡Excelente trabajo!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Si hay un mensaje de error, mostrarlo como una alerta */}
              {error && (
                <div className="w-full max-w-2xl mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              {/* Tarjeta de tarea actual */}
              {tareas[currentIndex] && (
                <Card className="w-full max-w-2xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Tarea #{tareas[currentIndex].id}</CardTitle>
                        <CardDescription>
                          Venta #{tareas[currentIndex].venta_id} - Producto #{tareas[currentIndex].numero_producto}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Orden de ejecución</div>
                        <div className="text-2xl font-bold">{tareas[currentIndex].orden_ejecucion}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Información del producto */}
                    <div className="p-3 bg-blue-50 rounded-md">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">Detalles del Producto</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium">{tareas[currentIndex].nombre_producto || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tallas</p>
                          <p className="font-medium">{tareas[currentIndex].tallas || 'No especificadas'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Colores</p>
                          <p className="font-medium">{tareas[currentIndex].colores || 'No especificados'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ID Producto</p>
                          <p className="font-medium">{tareas[currentIndex].producto_id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Paso</h3>
                        <p className="text-lg font-semibold">{tareas[currentIndex].nombre_paso}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Rol requerido</h3>
                        <p className="text-lg font-semibold">{tareas[currentIndex].rol_requerido}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Duración estimada</h3>
                        <p className="text-lg font-semibold">{tareas[currentIndex].duracion_estimada}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Fecha entrega</h3>
                        <p className="text-lg font-semibold">
                          {tareas[currentIndex].fecha_entrega ? new Date(tareas[currentIndex].fecha_entrega).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Descripción</h3>
                      <p className="text-base bg-gray-50 p-3 rounded-md">{tareas[currentIndex].descripcion}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Asignado a:</h3>
                        <p className="text-base">
                          {tareas[currentIndex].nombre} {tareas[currentIndex].apellido} - {tareas[currentIndex].telefono}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Detalles de la venta</h3>
                        <p className="text-base">
                          Venta #{tareas[currentIndex].venta_id}
                          {tareas[currentIndex].venta_data?.fecha_creacion && 
                            ` (${new Date(tareas[currentIndex].venta_data?.fecha_creacion).toLocaleDateString()})`}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estado actual</h3>
                      <div className="flex items-center mt-1">
                        <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                          {tareas[currentIndex].estado}
                        </div>
                        <span className="ml-3 text-sm text-gray-500">
                          Asignado: {tareas[currentIndex].fecha_asignacion ? new Date(tareas[currentIndex].fecha_asignacion).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {isRunning && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-md flex items-center justify-center">
                        <Clock className="mr-2 text-blue-500" />
                        <span className="text-2xl font-mono">{formatTime(timer)}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4 border-t">
                    {!isRunning ? (
                      <Button 
                        className="flex-1 gap-2" 
                        onClick={handleStartTask}
                        disabled={updatingTask || tareas[currentIndex].fecha_inicio !== null}
                      >
                        <Play size={18} />
                        Iniciar tarea
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700" 
                        onClick={handleFinishTask}
                        disabled={updatingTask}
                      >
                        <CheckCircle2 size={18} />
                        Completar tarea
                      </Button>
                    )}
                    
                    {isRunning && (
                      <Button 
                        variant="outline" 
                        className="ml-2 gap-2 border-red-300 text-red-600 hover:bg-red-50" 
                        onClick={() => {
                          setIsRunning(false);
                          setTimer(0);
                        }}
                        disabled={updatingTask}
                      >
                        <Square size={18} />
                        Cancelar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
