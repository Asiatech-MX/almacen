import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ShadcnDemo: React.FC = () => {
  const mockData = [
    { id: 1, nombre: 'Cemento Portland', stock: 150, unidad: 'Sacos', estado: 'Normal' },
    { id: 2, nombre: 'Acero Corrugado', stock: 25, unidad: 'Toneladas', estado: 'Bajo' },
    { id: 3, nombre: 'Bloques de Concreto', stock: 500, unidad: 'Unidades', estado: 'Normal' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          shadcn/ui + ISO 9241 Demo
        </h1>
        <p className="text-muted-foreground">
          Componentes accesibles implementados con Tailwind CSS y Radix UI
        </p>
      </div>

      {/* Form Example */}
      <Card>
        <CardHeader>
          <CardTitle>Formulario Accesible</CardTitle>
          <CardDescription>
            Ejemplo de formulario con validación y accesibilidad WCAG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre del Material"
            placeholder="Ingrese el nombre"
            required
            helperText="Ingrese un nombre descriptivo para el material"
          />
          <Input
            label="Cantidad en Stock"
            type="number"
            placeholder="0"
            error="Este campo es obligatorio"
          />
          <div className="flex space-x-2">
            <Button>Guardar</Button>
            <Button variant="outline" loading loadingText="Procesando...">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Example */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Materiales</CardTitle>
          <CardDescription>
            Tabla accesible con navegación por teclado y ordenación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead sort="none">Material</TableHead>
                <TableHead sort="asc">Stock</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{item.unidad}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        item.estado === 'Normal'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.estado}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerts Example */}
      <div className="space-y-4">
        <Alert variant="success" role="status" aria-live="polite">
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>
            Los materiales han sido actualizados correctamente.
          </AlertDescription>
        </Alert>

        <Alert variant="warning" role="alert" aria-live="assertive">
          <AlertTitle>Advertencia</AlertTitle>
          <AlertDescription>
            El stock de Acero Corrugado está por debajo del nivel mínimo.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

export default ShadcnDemo