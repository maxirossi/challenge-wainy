"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Building2, AlertCircle, Loader2, DollarSign, Users, AlertTriangle, Clock } from 'lucide-react'
import { useState } from 'react'

interface EntidadData {
  codigo: string
  nombre: string
  tipo_entidad: string
  activa: boolean
  resumen_deudores: {
    codigo_entidad: string
    total_deuda: number
    cantidad_deudores: number
    deudores_irregulares: number
    deudores_vencidos: number
  }
}

export default function EntidadesPage() {
  const [codigoEntidad, setCodigoEntidad] = useState('')
  const [entidad, setEntidad] = useState<EntidadData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!codigoEntidad.trim()) {
      setError('Por favor ingresa un código de entidad válido')
      return
    }

    setLoading(true)
    setError('')
    setEntidad(null)

    try {
      const response = await fetch(`http://localhost:8000/api/entidades/${codigoEntidad.trim()}`)
      const data = await response.json()

      if (data.success) {
        setEntidad(data.data)
      } else {
        setError(data.message || 'No se encontró la entidad')
      }
    } catch (err) {
      setError('Error al buscar la entidad')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Buscar por Entidad</h2>
          <p className="text-gray-600">Consulta la información de una entidad financiera específica</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda</CardTitle>
            <CardDescription>Ingresa el código de la entidad financiera (ej: BANCO001)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="codigoEntidad">Código de Entidad</Label>
                <Input
                  id="codigoEntidad"
                  type="text"
                  placeholder="BANCO001"
                  value={codigoEntidad}
                  onChange={(e) => setCodigoEntidad(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleSearch}
                  disabled={loading || !codigoEntidad.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  Buscar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {entidad && (
          <div className="space-y-6">
            {/* Información de la Entidad */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Entidad</CardTitle>
                <CardDescription>Detalles de la entidad financiera</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Código</Label>
                    <p className="text-lg font-semibold">{entidad.codigo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                    <p className="text-lg font-semibold">{entidad.nombre}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tipo de Entidad</Label>
                    <p className="text-lg font-semibold capitalize">{entidad.tipo_entidad}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estado</Label>
                    <p className={`text-lg font-semibold ${entidad.activa ? 'text-green-600' : 'text-red-600'}`}>
                      {entidad.activa ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Deudores */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Deudores</CardTitle>
                <CardDescription>Estadísticas de deudores de la entidad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Total Deuda</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(entidad.resumen_deudores.total_deuda)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-600">Total Deudores</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {entidad.resumen_deudores.cantidad_deudores}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-600">Deudores Vencidos</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {entidad.resumen_deudores.deudores_vencidos}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-gray-600">Deudores Irregulares</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {entidad.resumen_deudores.deudores_irregulares}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 