'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

interface District {
  id: string
  name: string
  isActive: boolean
}

interface Building {
  id: string
  street: string
  houseNumber: string
  yearBuilt: number | null
  wallMaterial: string | null
  layout: string | null
  totalFloors: number | null
  district: {
    name: string
  }
}

export default function TestFormDataPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  // Load districts on component mount
  useEffect(() => {
    loadDistricts()
  }, [])

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/districts')
      if (response.ok) {
        const data = await response.json()
        setDistricts(data)
        setResult(`✅ Loaded ${data.length} districts successfully`)
      } else {
        throw new Error('Failed to load districts')
      }
    } catch (error: any) {
      setError(`❌ Error loading districts: ${error.message}`)
    }
  }

  const loadBuildings = async (districtId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/addresses?districtId=${districtId}`)
      if (response.ok) {
        const data = await response.json()
        setBuildings(data)
        setResult(`✅ Loaded ${data.length} buildings for selected district`)
      } else {
        throw new Error('Failed to load buildings')
      }
    } catch (error: any) {
      setError(`❌ Error loading buildings: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId)
    if (districtId) {
      loadBuildings(districtId)
    } else {
      setBuildings([])
    }
  }

  const seedData = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      // First try to create some basic districts via API
      const basicDistricts = [
        { name: 'Центр', description: 'Центральный район' },
        { name: 'Бензострой', description: 'Район Бензострой' },
        { name: 'Вокзал', description: 'Район Вокзала' },
        { name: '20 мкр', description: '20 микрорайон' },
        { name: 'Рабочий', description: 'Рабочий поселок' }
      ]

      let created = 0
      for (const district of basicDistricts) {
        try {
          const response = await fetch('/api/districts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(district)
          })
          if (response.ok) {
            created++
          }
        } catch (err) {
          console.log(`District ${district.name} might already exist`)
        }
      }

      setResult(`✅ Created/verified ${created} districts. Reloading...`)
      await loadDistricts()
      
    } catch (error: any) {
      setError(`❌ Error seeding data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Form Data Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          {result && (
            <Alert>
              {result}
            </Alert>
          )}

          <div className="flex gap-4">
            <Button onClick={loadDistricts} disabled={loading}>
              {loading ? 'Loading...' : 'Reload Districts'}
            </Button>
            <Button onClick={seedData} disabled={loading} variant="outline">
              {loading ? 'Seeding...' : 'Seed Basic Data'}
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Districts ({districts.length})</h3>
            <select 
              value={selectedDistrict} 
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select District</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          {selectedDistrict && (
            <div>
              <h3 className="font-semibold mb-2">Buildings ({buildings.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {buildings.length === 0 ? (
                  <p className="text-gray-500">No buildings found for this district</p>
                ) : (
                  buildings.map(building => (
                    <div key={building.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">
                        {building.street}, {building.houseNumber}
                      </div>
                      <div className="text-gray-600">
                        Year: {building.yearBuilt || 'N/A'} | 
                        Material: {building.wallMaterial || 'N/A'} | 
                        Layout: {building.layout || 'N/A'} | 
                        Floors: {building.totalFloors || 'N/A'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Reload Districts" to check if districts are loaded</li>
              <li>If no districts, click "Seed Basic Data" to create some</li>
              <li>Select a district to see if buildings load</li>
              <li>Go to the main property form to test if dropdown menus work</li>
              <li>Test the year-built reference system by entering years like 1975, 1995, 2015</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}