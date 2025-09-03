'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, MapPin, Building, Calendar, Layers, Users } from 'lucide-react'

interface Building {
  id: string
  districtId: string
  street: string
  houseNumber: string
  fullAddress: string
  totalFloors: number | null
  yearBuilt: number | null
  wallMaterial: string | null
  entranceCount: number | null
  buildingType: string | null
  hasElevator: boolean
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  dataSource: string | null
  district: {
    id: string
    name: string
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onBuildingSelect?: (building: Building) => void
  onAddressData?: (data: {
    street: string
    houseNumber: string
    yearBuilt?: number
    wallMaterial?: string
    totalFloors?: number
    districtId?: string
  }) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  required?: boolean
  disableAutoSearch?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  onBuildingSelect,
  onAddressData,
  placeholder = 'Введите адрес...',
  disabled = false,
  label = 'Адрес',
  required = false,
  disableAutoSearch = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [alreadySearchedByValue, setAlreadySearchedByValue] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Поиск зданий с дебаунсом
  const searchBuildings = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/buildings/search?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.buildings || [])
        setShowSuggestions(data.buildings?.length > 0)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Ошибка поиска зданий:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  // Обработка изменения значения с дебаунсом
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      searchBuildings(newValue)
    }, 300) // Дебаунс 300мс
    
    setSearchTimeout(timeout)
  }

  // Функция для загрузки здания по адресу при редактировании
  const searchByExactAddress = async (exactAddress: string) => {
    if (!exactAddress || exactAddress.length < 3) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/buildings/search?q=${encodeURIComponent(exactAddress)}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.buildings && data.buildings.length > 0) {
          // Нашли соответствующее здание
          const building = data.buildings[0];
          console.log('Найдено здание по точному адресу:', building);
          // Тихо вызываем коллбэки с данными здания
          if (onBuildingSelect) {
            onBuildingSelect(building);
          }
          if (onAddressData) {
            onAddressData({
              street: building.street,
              houseNumber: building.houseNumber,
              yearBuilt: building.yearBuilt || undefined,
              wallMaterial: building.wallMaterial || undefined,
              totalFloors: building.totalFloors || undefined,
              districtId: building.districtId
            });
          }
        }
      }
    } catch (error) {
      console.error('Ошибка поиска здания по точному адресу:', error);
    } finally {
      setLoading(false);
    }
  }

  // Выбор здания из списка
  const selectBuilding = (building: Building) => {
    const fullAddress = building.fullAddress || `${building.street}, ${building.houseNumber}`
    onChange(fullAddress)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    // Вызываем колбэки с данными здания
    if (onBuildingSelect) {
      onBuildingSelect(building)
    }
    
    if (onAddressData) {
      onAddressData({
        street: building.street,
        houseNumber: building.houseNumber,
        yearBuilt: building.yearBuilt || undefined,
        wallMaterial: building.wallMaterial || undefined,
        totalFloors: building.totalFloors || undefined,
        districtId: building.districtId
      })
    }
  }

  // Обработка клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
        
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectBuilding(suggestions[selectedIndex])
        }
        break
        
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Автоскролл к выбранному элементу
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  // Проверяем значение value при монтировании или изменении
  useEffect(() => {
    // Если value уже заполнено (например, при редактировании), ищем соответствующее здание
    // Но только если disableAutoSearch не установлен
    if (!disableAutoSearch && value && value.length > 3 && !suggestions.length && !alreadySearchedByValue) {
      setAlreadySearchedByValue(true);
      searchByExactAddress(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, suggestions.length, alreadySearchedByValue, disableAutoSearch]);

  // Закрытие списка при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Получение иконки уровня достоверности
  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <div className='w-2 h-2 bg-green-500 rounded-full' title='Высокая достоверность' />
      case 'MEDIUM':
        return <div className='w-2 h-2 bg-yellow-500 rounded-full' title='Средняя достоверность' />
      case 'LOW':
        return <div className='w-2 h-2 bg-red-500 rounded-full' title='Низкая достоверность' />
      default:
        return <div className='w-2 h-2 bg-gray-400 rounded-full' title='Неизвестно' />
    }
  }

  return (
    <div ref={containerRef} className='relative w-full'>
      <div className='space-y-2'>
        {label && (
          <Label htmlFor='address-input'>
            {label}
            {required && <span className='text-red-500 ml-1'>*</span>}
          </Label>
        )}
        
        <div className='relative'>
          <Input
            ref={inputRef}
            id='address-input'
            type='text'
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className='pr-10'
          />
          
          {/* Иконка загрузки */}
          {loading && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
              <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
            </div>
          )}
          
          {/* Иконка адреса */}
          {!loading && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
              <MapPin className='h-4 w-4 text-gray-400' />
            </div>
          )}
        </div>
      </div>

      {/* Список предложений */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className='absolute z-50 w-full mt-1 max-h-80 overflow-auto border shadow-lg bg-white'>
          <div className='p-1'>
            {suggestions.map((building, index) => (
              <div
                key={building.id}
                ref={el => { suggestionRefs.current[index] = el; return undefined; }}
                className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => selectBuilding(building)}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    {/* Основной адрес */}
                    <div className='flex items-center gap-2 mb-1'>
                      <MapPin className='h-4 w-4 text-gray-500 flex-shrink-0' />
                      <span className='font-medium text-gray-900 truncate'>
                        {building.fullAddress}
                      </span>
                      {getConfidenceIcon(building.confidenceLevel)}
                    </div>
                    
                    {/* Район */}
                    <div className='text-sm text-gray-600 mb-2'>
                      {building.district.name}
                    </div>
                    
                    {/* Характеристики здания */}
                    <div className='flex flex-wrap gap-3 text-xs text-gray-500'>
                      {building.yearBuilt && (
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          <span>{building.yearBuilt} г.</span>
                        </div>
                      )}
                      
                      {building.totalFloors && (
                        <div className='flex items-center gap-1'>
                          <Building className='h-3 w-3' />
                          <span>{building.totalFloors} эт.</span>
                        </div>
                      )}
                      
                      {building.wallMaterial && (
                        <div className='flex items-center gap-1'>
                          <Layers className='h-3 w-3' />
                          <span>{building.wallMaterial}</span>
                        </div>
                      )}
                      
                      {building.entranceCount && (
                        <div className='flex items-center gap-1'>
                          <Users className='h-3 w-3' />
                          <span>{building.entranceCount} под.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Сообщение "ничего не найдено" */}
      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 2 && (
        <Card className='absolute z-50 w-full mt-1 border shadow-lg bg-white'>
          <div className='p-4 text-center text-gray-500'>
            <MapPin className='h-8 w-8 mx-auto mb-2 text-gray-300' />
            <p>Адрес не найден в справочнике</p>
            <p className='text-xs mt-1'>Попробуйте изменить запрос или добавьте здание в справочник</p>
          </div>
        </Card>
      )}
    </div>
  )
}
