"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductionTask } from "@/lib/mock-data"

interface TasksTableProps {
  tasks: ProductionTask[]
}

export default function TasksTable({ tasks }: TasksTableProps) {
  const getStatusBadge = (status: ProductionTask["status"]) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      case "en_proceso":
        return <Badge className="bg-blue-500">En proceso</Badge>
      case "completado":
        return <Badge className="bg-green-500">Completado</Badge>
      case "retrasado":
        return <Badge className="bg-red-500">Retrasado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No hay tareas de producción disponibles.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modelo</TableHead>
            <TableHead>Tarea</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha límite</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.model}</TableCell>
              <TableCell>{task.name}</TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
              <TableCell>{task.assigned_to}</TableCell>
              <TableCell className="text-right">{task.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
