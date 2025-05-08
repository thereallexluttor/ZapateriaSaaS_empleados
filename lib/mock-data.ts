// Datos simulados para la aplicación

// Simulación de usuario autenticado
export interface MockUser {
  id: string
  email: string
}

// Simulación de tareas de producción
export interface ProductionTask {
  id: number
  created_at: string
  name: string
  model: string
  status: "pendiente" | "en_proceso" | "completado" | "retrasado"
  deadline: string
  assigned_to: string
  quantity: number
}

// Datos de ejemplo para tareas de producción
export const mockTasks: ProductionTask[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    name: "Corte de cuero",
    model: "Zapato Oxford Clásico",
    status: "completado",
    deadline: "2025-05-15",
    assigned_to: "Carlos Méndez",
    quantity: 120,
  },
  {
    id: 2,
    created_at: new Date().toISOString(),
    name: "Costura de suela",
    model: "Zapato Oxford Clásico",
    status: "en_proceso",
    deadline: "2025-05-20",
    assigned_to: "María López",
    quantity: 120,
  },
  {
    id: 3,
    created_at: new Date().toISOString(),
    name: "Acabado final",
    model: "Zapato Oxford Clásico",
    status: "pendiente",
    deadline: "2025-05-25",
    assigned_to: "Juan Pérez",
    quantity: 120,
  },
  {
    id: 4,
    created_at: new Date().toISOString(),
    name: "Corte de material",
    model: "Zapatilla Deportiva Runner",
    status: "en_proceso",
    deadline: "2025-05-18",
    assigned_to: "Ana Gómez",
    quantity: 200,
  },
  {
    id: 5,
    created_at: new Date().toISOString(),
    name: "Ensamblaje",
    model: "Zapatilla Deportiva Runner",
    status: "pendiente",
    deadline: "2025-05-22",
    assigned_to: "Roberto Sánchez",
    quantity: 200,
  },
  {
    id: 6,
    created_at: new Date().toISOString(),
    name: "Control de calidad",
    model: "Bota de Trabajo Industrial",
    status: "retrasado",
    deadline: "2025-05-10",
    assigned_to: "Laura Martínez",
    quantity: 80,
  },
  {
    id: 7,
    created_at: new Date().toISOString(),
    name: "Empaquetado",
    model: "Sandalia Verano",
    status: "completado",
    deadline: "2025-05-12",
    assigned_to: "Diego Fernández",
    quantity: 150,
  },
]
