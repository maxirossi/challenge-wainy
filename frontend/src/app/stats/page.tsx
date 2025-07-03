"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface StatsData {
  resumen_general: {
    total_deudores: number
    total_entidades: number
    total_deuda: number
    deuda_promedio: number
  }
  situaciones: Array<{
    situacion: string
    cantidad: number
    total_deuda: string
  }>
  top_entidades: Array<{
    codigo_entidad: string
    cantidad_deudores: number
    total_deuda: string
  }>
  ultima_actualizacion: string
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.message || 'Error al cargar las estadísticas')
      }
    } catch (err) {
      setError('Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(numAmount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSituacionColor = (situacion: string) => {
    switch (situacion.toLowerCase()) {
      case 'normal':
        return 'text-green-600 bg-green-50'
      case 'vencida':
        return 'text-red-600 bg-red-50'
      case 'irregular':
        return 'text-orange-600 bg-orange-50'
      case 'morosa':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando estadísticas...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (!stats) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Estadísticas del Sistema</h2>
          <p className="text-gray-600">Resumen general y métricas del sistema de deudores</p>
          <p className="text-sm text-gray-500 mt-1">
            Última actualización: {formatDate(stats.ultima_actualizacion)}
          </p>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Deudores</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.resumen_general.total_deudores.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Total Entidades</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.resumen_general.total_entidades}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Total Deuda</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.resumen_general.total_deuda)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Deuda Promedio</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.resumen_general.deuda_promedio)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Situaciones de Deudores */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Situación</CardTitle>
              <CardDescription>Deudores clasificados por situación de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.situaciones.map((situacion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSituacionColor(situacion.situacion)}`}>
                        {situacion.situacion}
                      </div>
                      <span className="font-medium">{situacion.cantidad}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(situacion.total_deuda)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Entidades */}
          <Card>
            <CardHeader>
              <CardTitle>Top Entidades</CardTitle>
              <CardDescription>Entidades con mayor cantidad de deudores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.top_entidades.map((entidad, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{entidad.codigo_entidad}</p>
                        <p className="text-sm text-gray-600">{entidad.cantidad_deudores} deudores</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(entidad.total_deuda)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 