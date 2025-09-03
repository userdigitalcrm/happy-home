'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DataSummary {
  summary: {
    totalDistricts: number
    totalBuildings: number
    buildingsByDistrictCount: number
  }
  districts: Array<{
    id: string
    name: string
    buildingsCount: number
  }>
  sampleBuildings: Array<{
    id: string
    district: string
    address: string
    yearBuilt: number | null
    wallMaterial: string | null
    totalFloors: number | null
  }>
}

export default function DataCheckPage() {
  const [data, setData] = useState<DataSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/check-data')
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Проверка данных в базе</h1>
        <Button onClick={loadData} disabled={loading}>
          {loading ? 'Загрузка...' : 'Обновить'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Ошибка: {error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Сводка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.summary.totalDistricts}</div>
                  <div className="text-sm text-gray-600">Районов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.summary.totalBuildings}</div>
                  <div className="text-sm text-gray-600">Зданий</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.summary.buildingsByDistrictCount}</div>
                  <div className="text-sm text-gray-600">Районов с зданиями</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Районы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.districts.map(district => (
                  <div key={district.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{district.name}</div>
                    <div className="text-gray-600">{district.buildingsCount} зданий</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Примеры зданий</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.sampleBuildings.map(building => (
                  <div key={building.id} className="p-3 border rounded text-sm">
                    <div className="font-medium">{building.district} - {building.address}</div>
                    <div className="text-gray-600">
                      Год: {building.yearBuilt || 'не указан'} | 
                      Материал: {building.wallMaterial || 'не указан'} | 
                      Этажей: {building.totalFloors || 'не указано'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}