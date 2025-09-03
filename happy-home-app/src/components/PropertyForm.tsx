'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import PhotoUploader from '@/components/PhotoUploader'
import { getReferenceDataByYear, getYearPeriodDescription, getCombinedReferenceData } from '@/utils/referenceData'
import PropertyHistory from '@/components/PropertyHistory'

// Manual type definitions to avoid Prisma client import issues
type User = {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'MANAGER' | 'AGENT'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

type Category = {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

type District = {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

type Building = {
  id: string
  districtId: string
  street: string
  houseNumber: string
  buildingType: string | null
  yearBuilt: number | null
  wallMaterial: string | null
  layout: string | null
  totalFloors: number | null
  hasElevator: boolean
  hasGarbageChute: boolean
  heatingType: string | null
  isActive: boolean
}

type PropertyPhoto = {
  id: string
  propertyId: string
  filename: string
  url: string
  caption: string | null
  isPrimary: boolean
  createdAt: Date
  name?: string  // Added optional name property
}

type Property = {
  id: string
  categoryId: string
  districtId: string
  buildingId: string
  apartment: string | null
  floor: number | null
  totalArea: number | null
  livingArea: number | null
  kitchenArea: number | null
  rooms: number | null
  ceilingHeight: number | null
  balcony: string | null
  loggia: boolean
  renovation: 'NONE' | 'COSMETIC' | 'MAJOR' | 'DESIGNER'
  layout: string | null
  totalFloors: number | null
  condition: string | null
  yearBuilt: number | null
  phone: string | null
  source: string | null
  price: number | null
  pricePerSqm: number | null
  currency: string
  status: 'ACTIVE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'SUSPENDED' | 'INACTIVE' | 'BUSY' | 'AVAILABLE' | 'ON_VACATION'
  isArchived: boolean
  description: string | null
  notes: string | null
  createdById: string
  assignedToId: string | null
  createdAt: Date
  updatedAt: Date
  pField: string | null  // Added pField property
}

type PropertyWithRelations = Property & {
  category: Category
  district: District
  building: Building
  createdBy: Pick<User, 'name' | 'email'>
  assignedTo: Pick<User, 'name' | 'email'> | null
  photos: PropertyPhoto[]
  callAssignments: CallAssignment[]
}

// Make Photo compatible with PropertyPhoto
type Photo = PropertyPhoto

type CallAssignment = {
  id: string
  agentId: string
  isCalled: boolean
}

interface PropertyFormProps {
  property?: PropertyWithRelations | null
  categories: Category[]
  districts: District[]
  onSave: () => void
  onCancel: () => void
  onClose?: () => void
}

interface BuildingOption {
  id: string
  street: string
  houseNumber: string
  yearBuilt?: number
  wallMaterial?: string
  layout?: string
  totalFloors?: number
  hasElevator: boolean
  heatingType?: string
  districtId?: string  // Added missing districtId property
}

export default function PropertyForm({ property, categories, districts, onSave, onCancel }: PropertyFormProps) {
  console.log('PropertyForm received categories:', categories) // Debug log
  console.log('Categories type:', typeof categories) // Debug log
  console.log('Is categories array:', Array.isArray(categories)) // Debug log
  if (Array.isArray(categories)) {
    console.log('Categories count:', categories.length) // Debug log
    console.log('First category:', categories[0]) // Debug log
  }
  
  const { data: session } = useSession()
  const propertyId = property?.id ?? ''
  const [loading, setLoading] = useState(false)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [error, setError] = useState('')
  const [buildings, setBuildings] = useState<BuildingOption[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingOption | null>(null)
  const [agents, setAgents] = useState<User[]>([])
  const [referenceInfo, setReferenceInfo] = useState<string>('')
  const [showReferenceData, setShowReferenceData] = useState(false)
  const [seedError, setSeedError] = useState('') // Для отображения ошибок заполнения
  const [seedSuccess, setSeedSuccess] = useState('') // Для отображения сообщений об успехе
  
  // Новые состояния для автозаполнения адреса
  const [addressValue, setAddressValue] = useState('')
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([])
  
  // Состояния для полей с тегами и одиночным выбором
  const [showConditionSuggestions, setShowConditionSuggestions] = useState(false)
  const [selectedConditions, setSelectedConditions] = useState<string[]>(() => {
    if (property?.condition) {
      return property.condition.split(', ').filter(Boolean)
    }
    return []
  })
  
  // Добавляем состояние для поля Район
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    return property?.districtId || ''
  })
  
  const [showWallMaterialSuggestions, setShowWallMaterialSuggestions] = useState(false)
  const [selectedWallMaterial, setSelectedWallMaterial] = useState<string>(() => {
    return property?.building?.wallMaterial || ''
  })
  
  const [showLayoutSuggestions, setShowLayoutSuggestions] = useState(false)
  const [selectedLayout, setSelectedLayout] = useState<string>(() => {
    return property?.layout || ''
  })
  
  const [showBalconySuggestions, setShowBalconySuggestions] = useState(false)
  const [selectedBalcony, setSelectedBalcony] = useState<string>(() => {
    return property?.balcony || ''
  })
  
  const [showPFieldSuggestions, setShowPFieldSuggestions] = useState(false)
  const [selectedPField, setSelectedPField] = useState<string>(() => {
    return property?.pField || ''
  })
  
  const [showStatusSuggestions, setShowStatusSuggestions] = useState(false)

  // Call assignment related states - удалено по запросу

  
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    return property?.status || 'ACTIVE'
  })
  
  const [showHistory, setShowHistory] = useState(false)

  // Archive / Restore handler
  const handleArchiveRestore = async () => {
    if (!propertyId) return
    try {
      setArchiveLoading(true)
      const action = property?.isArchived ? 'restore' : 'archive'
      const res = await fetch(`/api/properties/${propertyId}/${action}`, {
        method: 'POST'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Ошибка при обновлении статуса архива')
      }
      onSave()
    } catch (err: any) {
      setError(err.message || 'Неизвестная ошибка')
    } finally {
      setArchiveLoading(false)
    }
  }
  
  // Refs для отслеживания кликов вне полей
  const conditionRef = useRef<HTMLDivElement>(null)
  const districtRef = useRef<HTMLDivElement>(null) // Добавляем ref для поля Район
  const wallMaterialRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  const balconyRef = useRef<HTMLDivElement>(null)
  const pFieldRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  
  // Dynamic field options loading removed; using static defaults
  const fieldOptions: { [key: string]: string[] } = {}
  
  // Все возможные значения для полей
  const conditionOptions = fieldOptions['condition'] ?? [
    'рем', 'евро', 'б/рем', 'косм.рем', 'хор.сост', 'кап.рем', 'част.рем', 'обыч',
    'от застройщика', 'от застр', 'рем от застр', 'предчистовая', 'черновая', 'ул черновая', 'чистовая отделка',
    'ух', 'впс', 'пв', 'св', 'нп', 'ст.двери', 'ламинат', 'лин', 'стол', 'меб', 'кух.гарн',
    'конд', 'быт.техн', 'студия', 'потол. плтк', 'сант', 'каф', 'б/каф', 'каф. совр',
    'декор панель', 'стар каф', 'пвх разв', 'с/у разд', 'с/у совм', 'пу', 'п/план',
    'п/план уз', 'п/план н/у', 'залог', 'б/залог', 'по', 'улучшенная', 'кухня', 'пвх', 'кл'  
  ]
  
  const wallMaterialOptions = fieldOptions['wallMaterial'] ?? ['к', 'п', 'д', 'м', 'б', 'ш', 'н/с', 'с/ш']
  
  const layoutOptions = fieldOptions['layout'] ?? ['нов', 'нвст', 'ст', 'ул', 'лен', 'омс', 'гост', 'общ', 'дом', 'кот', 'бар', 'сад']
  
  const balconyOptions = fieldOptions['balcony'] ?? ['лдж', 'блк', '2 блк', 'лдж/нз', 'лдж/здо', 'лдж/зпо', 'блк/здо', 'блк/зпо', 'блк/нз', 'без', '1лдж1блк', '2блк', '3блк']
  
  const pFieldOptions = fieldOptions['pField'] ?? ['н', 'т', 'у']
  
  const statusOptions = [
    { value: 'ACTIVE', label: 'в продаже' },
    { value: 'RESERVED', label: 'задаток' },
    { value: 'SUSPENDED', label: 'приостановленно' },
    { value: 'SOLD', label: 'продано' },
    { value: 'RENTED', label: 'снято с продажи' }
  ]
  
  // Status options specifically for Realtor category
  const realtorStatusOptions = [
    { value: 'ACTIVE', label: 'Активен' },
    { value: 'INACTIVE', label: 'Неактивен' },
    { value: 'BUSY', label: 'Занят' },
    { value: 'AVAILABLE', label: 'Доступен' },
    { value: 'ON_VACATION', label: 'В отпуске' }
  ]
  
  // Добавляем список районов Петропавловска (полный список)
  const districtOptions = [
    'Вокзал', 'Подгора', 'Рахмет', '20 Мкр', 'Колхозный', 'Бензострой',
    '2 Гор Бол', 'Скиф', 'ДБС', 'ВВИ', 'Северный', 'Рабочий',
    '19 Мкр', 'Азия', 'Буратино', 'Горотдел', 'ДСР', 'Уют',
    'Океан', '8 Школа', 'ДОБ', 'Дельфин', '17 Школа', 'Новый ЦОТ',
    'Сокол', 'Атлантида', 'Тайга', 'Берёзка', '3 Гор Бол', 'Черемушки',
    'Казахтелеком', 'Мастер', 'ЦОН', 'Дошкольник', 'Рахат', 'Новая Мечеть',
    'Бэст', '3 Баня', 'СКГУ', 'Ахтамар', 'Динамо', 'Радужный',
    'Мясокомбинат', 'Борки', 'Старт', 'Драм Театр Погодина', 'Достык Молл',
    '7 Школа', 'Гор Парк'
  ];
  
  // Закрытие подсказок при клике вне поля
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conditionRef.current && !conditionRef.current.contains(event.target as Node)) {
        setShowConditionSuggestions(false)
      }
      // Добавляем обработчик для поля Район
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictSuggestions(false)
      }
      if (wallMaterialRef.current && !wallMaterialRef.current.contains(event.target as Node)) {
        setShowWallMaterialSuggestions(false)
      }
      if (layoutRef.current && !layoutRef.current.contains(event.target as Node)) {
        setShowLayoutSuggestions(false)
      }
      if (balconyRef.current && !balconyRef.current.contains(event.target as Node)) {
        setShowBalconySuggestions(false)
      }
      if (pFieldRef.current && !pFieldRef.current.contains(event.target as Node)) {
        setShowPFieldSuggestions(false)
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Функция для форматирования цены
  const formatPrice = (price: string | number): string => {
    if (!price) return '';
    const priceNum = Number(price);
    if (isNaN(priceNum)) return '';
    
    // Делим на 1000 и округляем до целого
    const formattedPrice = Math.round(priceNum / 1000);
    return formattedPrice.toLocaleString('ru-RU'); // Форматирование с пробелами
  }
  
  // Обработчики для изменения значений полей
  const handleConditionChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value)
    const newValue = selectedOptions.join(', ')
    
    setSelectedConditions(selectedOptions)
    // Обновляем formData для сохранения
    setFormData(prev => ({
      ...prev,
      condition: newValue
    }))
  }
  
  // Добавляем обработчик для поля Район
  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value)
    setFormData(prev => ({
      ...prev,
      districtId: value
    }))
    setShowDistrictSuggestions(false)
  }
  
  const handleWallMaterialChange = (value: string) => {
    setSelectedWallMaterial(value)
    setFormData(prev => ({
      ...prev,
      wallMaterial: value
    }))
    setShowWallMaterialSuggestions(false)
  }
  
  const handleLayoutChange = (value: string) => {
    setSelectedLayout(value)
    setFormData(prev => ({
      ...prev,
      layout: value
    }))
    setShowLayoutSuggestions(false)
  }
  
  const handleBalconyChange = (value: string) => {
    setSelectedBalcony(value)
    setFormData(prev => ({
      ...prev,
      balcony: value
    }))
    setShowBalconySuggestions(false)
  }
  
  const handlePFieldChange = (value: string) => {
    setSelectedPField(value)
    setFormData(prev => ({
      ...prev,
      pField: value
    }))
    setShowPFieldSuggestions(false)
  }
  
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as 'ACTIVE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'SUSPENDED' | 'INACTIVE' | 'BUSY' | 'AVAILABLE' | 'ON_VACATION')
    setFormData(prev => ({
      ...prev,
      status: value as 'ACTIVE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'SUSPENDED' | 'INACTIVE' | 'BUSY' | 'AVAILABLE' | 'ON_VACATION'
    }))
    setShowStatusSuggestions(false)
  }
  
  const handleConditionTagClick = (condition: string) => {
    const newSelectedConditions = selectedConditions.includes(condition)
      ? selectedConditions.filter(c => c !== condition)
      : [...selectedConditions, condition]
    
    setSelectedConditions(newSelectedConditions)
    setFormData(prev => ({
      ...prev,
      condition: newSelectedConditions.join(', ')
    }))
  }
  
  // Добавляем обработчик клика по тегу для поля Район
  const handleDistrictTagClick = (districtId: string) => {
    if (selectedDistrict === districtId) {
      // Если кликнули по уже выбранному району - сбрасываем выбор
      setSelectedDistrict('')
      setFormData(prev => ({
        ...prev,
        districtId: ''
      }))
    } else {
      // Выбираем новый район
      setSelectedDistrict(districtId)
      setFormData(prev => ({
        ...prev,
        districtId: districtId
      }))
    }
  }
  

  
  const [formData, setFormData] = useState({
    categoryId: property?.categoryId || '',
    districtId: property?.districtId || '',
    buildingId: property?.buildingId || '',
    apartment: property?.apartment || '',
    floor: property?.floor?.toString() || '',
    totalFloors: property?.totalFloors?.toString() || property?.building?.totalFloors?.toString() || '',
    wallMaterial: property?.building?.wallMaterial || '',
    totalArea: property?.totalArea?.toString() || '',
    livingArea: property?.livingArea?.toString() || '',
    kitchenArea: property?.kitchenArea?.toString() || '',
    balcony: property?.balcony || '',
    loggia: property?.loggia || false,
    layout: property?.layout || '',
    condition: property?.condition || '',
    yearBuilt: property?.yearBuilt?.toString() || property?.building?.yearBuilt?.toString() || '',
    phone: property?.phone || '',
    source: property?.source || '',
    price: property?.price?.toString() || '',
    pricePerSqm: property?.pricePerSqm?.toString() || '',
    status: property?.status || 'ACTIVE',
    description: property?.description || '',
    pField: property?.pField || '', // Новое поле П
    photos: property?.photos || [], // Initialize with existing photos
    street: property?.building?.street || '',
    houseNumber: property?.building?.houseNumber || ''
  })

  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/users?role=AGENT')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }, [setAgents])

  const loadBuildings = useCallback(async () => {
    try {
      const districtId = formData.districtId || property?.districtId
      if (!districtId) return
      
      console.log('Loading buildings for districtId:', districtId)
      
      const response = await fetch(`/api/addresses?districtId=${districtId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded buildings:', data)
        setBuildings(data)
      } else {
        console.error('Failed to load buildings. Response:', response.status)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('Failed to load buildings:', error)
    }
  }, [formData.districtId, property?.districtId, setBuildings])

  useEffect(() => {
    loadAgents()
    // Если редактируется объект и есть район, загружаем здания
    if (property?.districtId) {
      loadBuildings()
    }
  }, [property?.districtId, loadAgents, loadBuildings]) // Only run when districtId changes

  useEffect(() => {
    // Initialize form with property data if editing
    if (property) {
      console.log('Initializing form with property:', property);
      
      // Инициализируем значение адреса для поля автозаполнения
      if (property.building) {
        const fullAddress = `${property.building.street}, ${property.building.houseNumber}${property.apartment ? `, кв. ${property.apartment}` : ''}`;
        console.log('Setting address value:', fullAddress);
        setAddressValue(fullAddress);
      }
      
      setFormData({
        categoryId: property.categoryId || '',
        districtId: property.districtId || '',
        buildingId: property.buildingId || '',
        apartment: property.apartment || '',
        floor: property.floor?.toString() || '',
        totalFloors: property.totalFloors?.toString() || property.building?.totalFloors?.toString() || '',
        wallMaterial: property.building?.wallMaterial || '',
        totalArea: property.totalArea?.toString() || '',
        livingArea: property.livingArea?.toString() || '',
        kitchenArea: property.kitchenArea?.toString() || '',
        balcony: property.balcony || '',
        loggia: property.loggia || false,
        layout: property.layout || '',
        condition: property.condition || '',
        yearBuilt: property.yearBuilt?.toString() || property.building?.yearBuilt?.toString() || '',
        phone: property.phone || '',
        source: property.source || '',
        price: property.price?.toString() || '',
        pricePerSqm: property.pricePerSqm?.toString() || '',
        status: property.status || 'ACTIVE',
        description: property.description || '',
        pField: property.pField || '', // Исправляем инициализацию поля pField
        photos: property.photos || [], // Initialize with existing photos
        street: property.building?.street || '',
        houseNumber: property.building?.houseNumber || ''
      });
      
      console.log('Initialized photos:', property.photos);
      
      // Set selected values for tag fields
      if (property.condition) {
        setSelectedConditions(property.condition.split(', ').filter(Boolean));
      }
      
      if (property.districtId) {
        setSelectedDistrict(property.districtId);
      }
      
      if (property.building?.wallMaterial) {
        setSelectedWallMaterial(property.building.wallMaterial);
      }
      
      if (property.layout) {
        setSelectedLayout(property.layout);
      }
      
      if (property.balcony) {
        setSelectedBalcony(property.balcony);
      }
      
      if (property.pField) {
        setSelectedPField(property.pField);
      }
      
      if (property.status) {
        setSelectedStatus(property.status);
      }
      
      // Set building if exists
      if (property.buildingId && Array.isArray(buildings)) {
        const building = buildings.find(b => b.id === property.buildingId)
        if (building) {
          setSelectedBuilding(building)
        }
      }
    }
  }, [property]) // Only run when property changes

  // Add state to track if address field has been manually edited
  const [addressManuallyEdited, setAddressManuallyEdited] = useState(false);
  
  // Handler for address change
  const handleAddressChange = (newValue: string) => {
    setAddressValue(newValue);
    setAddressManuallyEdited(true); // Mark as manually edited
  };

  useEffect(() => {
    if (formData.districtId) {
      loadBuildings()
    }
  }, [formData.districtId, loadBuildings])

  useEffect(() => {
    if (formData.buildingId && Array.isArray(buildings)) {
      const building = buildings.find(b => b.id === formData.buildingId)
      setSelectedBuilding(building || null)
      
      // Если здание найдено, формируем полный адрес для поля адреса
      if (building) {
        const fullAddress = `${building.street}, ${building.houseNumber}${formData.apartment ? `, кв. ${formData.apartment}` : ''}`;
        setAddressValue(fullAddress);
      }
    } else {
      setSelectedBuilding(null)
      
      // Если buildingId пустой, очищаем поле адреса
      if (!formData.buildingId) {
        setAddressValue('');
      }
    }
  }, [formData.buildingId, buildings, formData.apartment, setSelectedBuilding, setAddressValue])





  // Эффект для автозаполнения на основе года постройки
  useEffect(() => {
    const year = Number(formData.yearBuilt)
    if (year && year >= 1950 && year <= new Date().getFullYear()) {
      const districtName = (districts && Array.isArray(districts) ? districts.find(d => d.id === formData.districtId)?.name : null) || undefined
      const referenceData = getCombinedReferenceData(year, districtName)
      const periodDescription = getYearPeriodDescription(year)
      
      if (referenceData) {
        setReferenceInfo(periodDescription)
        setShowReferenceData(true)
        
        // Автозаполнение полей, только если они пустые
        setFormData(prev => ({
          ...prev,
          wallMaterial: prev.wallMaterial || referenceData.wallMaterial,
          layout: prev.layout || referenceData.layout,
          condition: prev.condition || referenceData.condition,
          totalFloors: prev.totalFloors || referenceData.totalFloors?.toString() || '',
          balcony: prev.balcony || referenceData.balcony
        }))
      }
    } else {
      setShowReferenceData(false)
      setReferenceInfo('')
    }
  }, [formData.yearBuilt, formData.districtId, districts])

  // Новая функция для обработки выбора здания из справочника
  const handleBuildingSelect = (building: any) => {
    console.log('[DEBUG] Selected building:', building)
    const fullAddress = `${building.street}, ${building.houseNumber}`

    // Сохраняем выбранное здание и адрес
    setSelectedBuilding(building)
    setAddressValue(fullAddress)

    // Определяем какие поля будут автозаполнены
    const fieldsToFill: string[] = []

    // Атомарно обновляем форму
    setFormData(prev => {
      const updated = { ...prev }
      console.log('[DEBUG] formData BEFORE update:', prev)
      if (building.districtId) {
        updated.districtId = building.districtId
        fieldsToFill.push('districtId')
      }
      if (building.yearBuilt) {
        updated.yearBuilt = building.yearBuilt.toString()
        fieldsToFill.push('yearBuilt')
      }
      if (building.wallMaterial) {
        updated.wallMaterial = building.wallMaterial
        fieldsToFill.push('wallMaterial')
      }
      if (building.totalFloors) {
        updated.totalFloors = building.totalFloors.toString()
        fieldsToFill.push('totalFloors')
      }
      if (building.layout) {
        updated.layout = building.layout;
        fieldsToFill.push('layout');
      }
      if (building.id) {
        updated.buildingId = building.id
      }
      // Сохраняем улицу и номер дома для надежности
      updated.street = building.street
      updated.houseNumber = building.houseNumber

      return updated
    })

    // Обновляем выбранные значения в теговых полях
    if (building.districtId) {
      setSelectedDistrict(building.districtId);
    }
    if (building.wallMaterial) {
      setSelectedWallMaterial(building.wallMaterial);
    }
    if (building.layout) {
      setSelectedLayout(building.layout);
    }

    setAutoFilledFields(fieldsToFill)
  }

  // Обработчик для автозаполнения по адресу
  const handleAddressData = (data: {
    street: string
    houseNumber: string
    yearBuilt?: number
    wallMaterial?: string
    totalFloors?: number
    districtId?: string
  }) => {
    console.log('[DEBUG] handleAddressData received:', data)
    setFormData(prev => {
      const updated = {
        ...prev,
        districtId: data.districtId || prev.districtId,
        yearBuilt: data.yearBuilt ? data.yearBuilt.toString() : prev.yearBuilt,
        wallMaterial: data.wallMaterial || prev.wallMaterial,
        totalFloors: data.totalFloors ? data.totalFloors.toString() : prev.totalFloors
      }
      console.log('[DEBUG] formData AFTER handleAddressData:', updated)
      return updated
    })
  }

  const handleInputChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => {
      if (field === 'condition' && Array.isArray(value)) {
        return {
          ...prev,
          [field]: value.join(', ')
        };
      }

      const newData = { ...prev, [field]: value } as typeof prev;

      if (field === 'price' || field === 'totalArea') {
        const price = field === 'price' ? Number(value) : Number(prev.price);
        const area = field === 'totalArea' ? Number(value) : Number(prev.totalArea);

        if (price && area) {
          newData.pricePerSqm = Math.round(price / area).toString();
        } else {
          newData.pricePerSqm = '';
        }
      }

      return newData;
    });
  }, []);

  const currentPhotos = useMemo(() => {
    console.log('Computing currentPhotos from formData.photos:', formData.photos);
    return formData.photos || [];
  }, [formData.photos]);

  // Define isRealtorCategory in component scope so it can be used in JSX
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const isRealtorCategory = selectedCategory?.name === 'РИЭЛТОР';
  
  // Determine which status options to use based on category
  const currentStatusOptions = isRealtorCategory ? realtorStatusOptions : statusOptions;

  const handlePhotosChange = useCallback((photos: PropertyPhoto[]) => {
    console.log('Photos changed in PropertyForm:', photos);
    setFormData(prev => {
      // Check if photos actually changed
      const prevUrls = (prev.photos || []).map((p: PropertyPhoto) => p.url).sort();
      const newUrls = photos.map((p: PropertyPhoto) => p.url).sort();
      
      if (JSON.stringify(prevUrls) === JSON.stringify(newUrls)) {
        console.log('Photos unchanged, skipping update');
        return prev;
      }
      
      console.log('Photos changed, updating formData');
      return { ...prev, photos };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Удалена обработка статуса прозвона

    try {
      // Validate required fields
      if (isRealtorCategory) {
        // Special validation for "РИЭЛТОР" category - only phone and status are required
        if (!formData.phone || !formData.status) {
          throw new Error('Для категории "РИЭЛТОР" обязательны только телефон и статус');
        }
      } else {
        // Standard validation for all other categories
        if (!formData.categoryId || !formData.districtId || !formData.buildingId) {
          throw new Error('Категория, район и адрес обязательны');
        }
      }

      // Prepare photos data for API
      const preparedPhotos = Array.isArray(formData.photos) 
        ? formData.photos.map(photo => ({
          url: photo.url,
          name: photo.filename || photo.name || 'unnamed.jpg'
        }))
        : []

      console.log('Sending photos to API:', preparedPhotos);

      const requestData: Record<string, unknown> = {
        ...formData,
        floor: formData.floor ? Number(formData.floor) : null,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : null,
        totalArea: formData.totalArea ? Number(formData.totalArea) : null,
        livingArea: formData.livingArea ? Number(formData.livingArea) : null,
        kitchenArea: formData.kitchenArea ? Number(formData.kitchenArea) : null,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : null,
        price: formData.price ? Number(formData.price) : null,
        pricePerSqm: formData.pricePerSqm ? Number(formData.pricePerSqm) : null,
        balcony: formData.balcony || null,
        wallMaterial: formData.wallMaterial || null,
        layout: formData.layout || null,
        condition: formData.condition || null,
        phone: formData.phone || null,
        source: formData.source || null,
        pField: formData.pField || null,
        photos: preparedPhotos // Use prepared photos
      }

      // Remove undefined values
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined) {
          delete requestData[key];
        }
      });
      
      // For agents, remove fields they're not allowed to edit
      if (session?.user?.role === 'AGENT') {
        const restrictedFields = [
          'categoryId', 'districtId', 'buildingId', 'apartment', 
          'yearBuilt', 'wallMaterial', 'layout', 'totalFloors', 'isArchived'
        ];
        
        restrictedFields.forEach(field => {
          if (requestData[field] !== undefined) {
            console.log(`AGENT: Removing restricted field ${field} from request data`);
            delete requestData[field];
          }
        });
        
        // Also remove building relation if present
        if (requestData.building !== undefined) {
          console.log(`AGENT: Removing restricted field building from request data`);
          delete requestData.building;
        }
      }

      const url = property ? `/api/properties/${property.id}` : '/api/properties'
      const method = property ? 'PUT' : 'POST'

      console.log('Sending request to:', url, 'with method:', method);
      console.log('Request data:', requestData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка сохранения')
      }

      console.log('Property saved successfully');
      onSave()
    } catch (error: unknown) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const canEditField = (field: string) => {
    // If property is archived and user is agent, no fields can be edited
    if (property?.isArchived && session?.user?.role === 'AGENT') {
      return false;
    }
    
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
      return true;
    }
    
    if (session?.user?.role === 'AGENT') {
      // For Realtor category, agents can edit more fields
      if (isRealtorCategory) {
        // Agents can edit phone, status, and description for Realtor category
        const allowedFields = ['phone', 'status', 'description'];
        return allowedFields.includes(field);
      } else {
        // Agents cannot edit address-related fields for non-Realtor categories
        const restrictedFields = [
          'categoryId', 'districtId', 'buildingId', 'apartment', 
          'yearBuilt', 'wallMaterial', 'layout', 'totalFloors', 'isArchived'
        ];
        
        return !restrictedFields.includes(field);
      }
    }
    return false;
  }

  // Update the form rendering to conditionally show fields based on category
  return (
    <Card className="w-full h-full max-h-[90vh] flex flex-col border-0 shadow-none">
      <CardContent className="flex-grow overflow-y-auto p-4 pb-0 pt-2">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}
          
          {/* Секция прозвона удалена по запросу */}
          
          {seedError && (
            <Alert variant="destructive">
              {seedError}
            </Alert>
          )}
          
          {seedSuccess && (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <div className="text-green-800">
                {seedSuccess}
              </div>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2" style={{ minWidth: '100px', flex: '1 1 auto' }}>
              <Label htmlFor="categoryId">Категория *</Label>
              <select
                id="categoryId"
                className="w-full p-2 border rounded"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                disabled={!canEditField('categoryId')}
                required
              >
                <option value="">Выберите категорию</option>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="" disabled>Загрузка категорий...</option>
                    {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                      <option value="" disabled>
                        Категории отсутствуют. Нажмите кнопку &quot;Заполнить категории&quot; ниже.
                      </option>
                    )}
                  </>
                )}
              </select>
              {/* Отладочная информация для проверки загрузки категорий */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500">
                  Категории загружены: {Array.isArray(categories) ? categories.length : '0'}
                </div>
              )}
            </div>
            
            {/* Status field - always required */}
            <div className="space-y-2" style={{ minWidth: '100px', flex: '1 1 auto' }} ref={statusRef}>
              <Label htmlFor="status">Статус *</Label>
              <div className="relative">
                <div 
                  className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('status') ? 'bg-gray-100' : ''}`}
                  onClick={() => canEditField('status') && setShowStatusSuggestions(!showStatusSuggestions)}
                >
                  {selectedStatus ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                      {currentStatusOptions.find(s => s.value === selectedStatus)?.label || selectedStatus}
                      {canEditField('status') && (
                        <button
                          type="button"
                          className="ml-1 text-blue-800 hover:text-blue-900"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange('')
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                  )}
                </div>
                
                {showStatusSuggestions && canEditField('status') && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                    {currentStatusOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                          selectedStatus === option.value ? 'bg-blue-50' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(option.value)
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Чекбокс "Прозвонено" был удален по запросу */}

            {/* Price field - optional for Realtor category */}
            {(!isRealtorCategory || formData.price) && (
              <div className="space-y-2" style={{ minWidth: '100px', flex: '1 1 auto' }}>
                <Label htmlFor="price">Цена (тг)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="15 000"
                  className="w-full"
                  disabled={!canEditField('price')}
                />
                {formData.price && (
                  <div className="text-sm text-gray-500">
                    Отображается как: {formatPrice(formData.price)} (тыс. тг)
                  </div>
                )}
              </div>
            )}

            {/* Компонент автозаполнения адреса - optional for Realtor category */}
            {!isRealtorCategory && (
              <div className="space-y-2" style={{ minWidth: '100px', flex: '1 1 auto' }}>
                <AddressAutocomplete
                  value={addressValue}
                  onChange={handleAddressChange} // Use the new handler
                  onBuildingSelect={handleBuildingSelect}
                  onAddressData={handleAddressData}
                  label="Адрес *"
                  placeholder="Начните вводить адрес..."
                  required
                  disabled={!canEditField('buildingId')}
                  disableAutoSearch={!addressManuallyEdited && (session?.user?.role === 'AGENT')} // Disable auto search for agents unless manually edited
                />
                {autoFilledFields.length > 0 && (
                  <div className="text-xs text-green-600 mt-1">✓ Автозаполнение применено</div>
                )}
              </div>
            )}
          </div>

          {/* Property Details - Only show for non-Realtor categories or if agent has permission to edit */}
          {!isRealtorCategory && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-nowrap gap-1 w-full items-end">
                {/* District - новое поле перед Apartment */}
                <div className="space-y-2" style={{ flex: '2 0 120px', maxWidth: '250px' }} ref={districtRef}>
                  <Label htmlFor="district">Район *</Label>
                  <div className="relative">
                    <div 
                      className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('districtId') ? 'bg-gray-100' : ''}`}
                      onClick={() => canEditField('districtId') && setShowDistrictSuggestions(!showDistrictSuggestions)}
                    >
                      {selectedDistrict ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                          {(districts && Array.isArray(districts) ? districts.find(d => d.id === selectedDistrict)?.name : null) || 'Неизвестный район'}
                          {canEditField('districtId') && (
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDistrictChange('')
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                      )}
                    </div>
                    
                    {showDistrictSuggestions && canEditField('districtId') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                        <div className="flex flex-wrap gap-1 p-2 max-h-60 overflow-y-auto">
                          {districtOptions.map((option) => (
                            <div
                              key={option}
                              className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                (districts && Array.isArray(districts) && districts.find(d => d.name === option)?.id === selectedDistrict) 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Находим id района по имени
                                const district = districts && Array.isArray(districts) ? districts.find(d => d.name === option) : null;
                                if (district) {
                                  handleDistrictChange(district.id);
                                }
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Apartment */}
                <div className="space-y-2" style={{ flex: '1 0 60px' }}>
                  <Label htmlFor="apartment">Квартира</Label>
                  <Input
                    id="apartment"
                    value={formData.apartment}
                    onChange={(e) => handleInputChange('apartment', e.target.value)}
                    placeholder="Кв."
                    className="w-full"
                    disabled={!canEditField('apartment')}
                  />
                </div>

                {/* Floor */}
                <div className="space-y-2" style={{ flex: '1 0 60px' }}>
                  <Label htmlFor="floor">Этаж</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor}
                    onChange={(e) => handleInputChange('floor', e.target.value)}
                    min="1"
                    className="w-full"
                    disabled={!canEditField('floor')}
                  />
                </div>

                {/* Total Floors */}
                <div className="space-y-2" style={{ flex: '1 0 80px' }}>
                  <Label htmlFor="totalFloors">Этажность</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => handleInputChange('totalFloors', e.target.value)}
                    min="1"
                    placeholder="Ы"
                    className={`w-full ${showReferenceData && formData.totalFloors ? 'border-blue-300 bg-blue-50' : ''}`}
                    disabled={!canEditField('totalFloors')}
                  />
                </div>

                {/* Total Area */}
                <div className="space-y-2" style={{ flex: '1 0 80px' }}>
                  <Label htmlFor="totalArea">Общая площадь</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    step="0.1"
                    value={formData.totalArea}
                    onChange={(e) => handleInputChange('totalArea', e.target.value)}
                    placeholder="S"
                    className="w-full"
                    disabled={!canEditField('totalArea')}
                  />
                </div>

                {/* Living Area */}
                <div className="space-y-2" style={{ flex: '1 0 80px' }}>
                  <Label htmlFor="livingArea">Жилая площадь</Label>
                  <Input
                    id="livingArea"
                    type="number"
                    step="0.1"
                    value={formData.livingArea}
                    onChange={(e) => handleInputChange('livingArea', e.target.value)}
                    placeholder="S ж"
                    className="w-full"
                    disabled={!canEditField('livingArea')}
                  />
                </div>

                {/* Kitchen Area */}
                <div className="space-y-2" style={{ flex: '1 0 80px' }}>
                  <Label htmlFor="kitchenArea">Площадь кухни</Label>
                  <Input
                    id="kitchenArea"
                    type="number"
                    step="0.1"
                    value={formData.kitchenArea}
                    onChange={(e) => handleInputChange('kitchenArea', e.target.value)}
                    placeholder="S кх"
                    className="w-full"
                    disabled={!canEditField('kitchenArea')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Features - Only show for non-Realtor categories or if agent has permission to edit */}
          {!isRealtorCategory && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-wrap gap-2">
                {/* Wall Material */}
                <div className="space-y-2" style={{ minWidth: '70px', flex: '1 1 auto' }} ref={wallMaterialRef}>
                  <Label htmlFor="wallMaterial">Материал стен {showReferenceData && '📋'}</Label>
                  <div className="relative">
                    <div 
                      className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('wallMaterial') ? 'bg-gray-100' : ''}`}
                      onClick={() => canEditField('wallMaterial') && setShowWallMaterialSuggestions(!showWallMaterialSuggestions)}
                    >
                      {selectedWallMaterial ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                          {selectedWallMaterial}
                          {canEditField('wallMaterial') && (
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleWallMaterialChange('')
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                      )}
                    </div>
                    
                    {showWallMaterialSuggestions && canEditField('wallMaterial') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                        <div className="flex flex-wrap gap-1 p-2 max-h-40 overflow-y-auto">
                          {wallMaterialOptions.map((option) => (
                            <div
                              key={option}
                              className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                selectedWallMaterial === option 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleWallMaterialChange(option)
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Layout */}
                <div className="space-y-2" style={{ minWidth: '70px', flex: '1 1 auto' }} ref={layoutRef}>
                  <Label htmlFor="layout">Планировка {showReferenceData && '📋'}</Label>
                  <div className="relative">
                    <div 
                      className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('layout') ? 'bg-gray-100' : ''}`}
                      onClick={() => canEditField('layout') && setShowLayoutSuggestions(!showLayoutSuggestions)}
                    >
                      {selectedLayout ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                          {selectedLayout}
                          {canEditField('layout') && (
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLayoutChange('')
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                      )}
                    </div>
                    
                    {showLayoutSuggestions && canEditField('layout') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                        <div className="flex flex-wrap gap-1 p-2 max-h-40 overflow-y-auto">
                          {layoutOptions.map((option) => (
                            <div
                              key={option}
                              className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                selectedLayout === option 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLayoutChange(option)
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Balcony */}
                <div className="space-y-2" style={{ minWidth: '70px', flex: '1 1 auto' }} ref={balconyRef}>
                  <Label htmlFor="balcony">Балкон/Лоджия {showReferenceData && '📋'}</Label>
                  <div className="relative">
                    <div 
                      className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('balcony') ? 'bg-gray-100' : ''}`}
                      onClick={() => canEditField('balcony') && setShowBalconySuggestions(!showBalconySuggestions)}
                    >
                      {selectedBalcony ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                          {selectedBalcony}
                          {canEditField('balcony') && (
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBalconyChange('')
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                      )}
                    </div>
                    
                    {showBalconySuggestions && canEditField('balcony') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                        <div className="flex flex-wrap gap-1 p-2 max-h-40 overflow-y-auto">
                          {balconyOptions.map((option) => (
                            <div
                              key={option}
                              className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                selectedBalcony === option 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBalconyChange(option)
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* P Field */}
                <div className="space-y-2" style={{ minWidth: '50px', flex: '1 1 auto' }} ref={pFieldRef}>
                  <Label htmlFor="pField">Положение</Label>
                  <div className="relative">
                    <div 
                      className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('pField') ? 'bg-gray-100' : ''}`}
                      onClick={() => canEditField('pField') && setShowPFieldSuggestions(!showPFieldSuggestions)}
                    >
                      {selectedPField ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                          {selectedPField}
                          {canEditField('pField') && (
                            <button
                              type="button"
                              className="ml-1 text-blue-800 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePFieldChange('')
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                      )}
                    </div>
                    
                    {showPFieldSuggestions && canEditField('pField') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                        <div className="flex flex-wrap gap-1 p-2 max-h-40 overflow-y-auto">
                          {pFieldOptions.map((option) => (
                            <div
                              key={option}
                              className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                selectedPField === option 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePFieldChange(option)
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Condition */}
                <div className="space-y-2" style={{ minWidth: '150px', flex: '2 1 auto' }} ref={conditionRef}>
                  <Label htmlFor="condition">Состояние {showReferenceData && '📋'}</Label>
                  <div className="relative">
                    <div 
                      className={`w-full p-2 border rounded min-h-[40px] cursor-text flex flex-wrap gap-1 ${!canEditField('condition') ? 'bg-gray-100' : ''}`}
                      onClick={() => canEditField('condition') && setShowConditionSuggestions(!showConditionSuggestions)}
                    >
                      {selectedConditions.length > 0 ? (
                        selectedConditions.map((condition) => (
                          <span key={condition} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                            {condition}
                            {canEditField('condition') && (
                              <button
                                type="button"
                                className="ml-1 text-blue-800 hover:text-blue-900"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConditionTagClick(condition)
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Нажмите для выбора...</span>
                      )}
                    </div>
                    
                    {showConditionSuggestions && canEditField('condition') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                        <div className="flex flex-wrap gap-1 p-2 max-h-40 overflow-y-auto">
                          {conditionOptions.map((option) => (
                            <div
                              key={option}
                              className={`px-2 py-1 cursor-pointer text-xs rounded ${
                                selectedConditions.includes(option) 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleConditionTagClick(option)
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Year Built field */}
                <div className="space-y-2" style={{ minWidth: '100px', flex: '1 1 auto' }}>
                  <Label>Год постройки</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="yearBuilt"
                        type="number"
                        value={formData.yearBuilt}
                        onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                        min="1900"
                        max={new Date().getFullYear()}
                        placeholder="Год"
                        className="w-full"
                        disabled={!canEditField('yearBuilt')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact and Source Information - Three column layout */}
          {/* For Realtor category, show only phone as required, others as optional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-0">
            <div className="space-y-1">
              <Label htmlFor="phone">
                Телефоны {isRealtorCategory ? '*' : ''}
              </Label>
              <textarea
                id="phone"
                className="w-full p-2 border rounded min-h-[80px]"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Укажите телефоны через пробел, запятую или с новой строки"
                required={isRealtorCategory}
                disabled={!canEditField('phone')}
              />
            </div>

            {/* Source and Description - optional for Realtor category */}
            {(!isRealtorCategory || formData.source) && (
              <div className="space-y-1">
                <Label htmlFor="source">Источник</Label>
                <textarea
                  id="source"
                  className="w-full p-2 border rounded min-h-[80px]"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  placeholder="Укажите до 5 ссылок на источники, каждую с новой строки"
                  disabled={!canEditField('source')}
                />
              </div>
            )}
            
            <div className="space-y-1">
  <Label htmlFor="description">
    {isRealtorCategory ? 'Имя и Фамилия' : 'Описание'}
  </Label>
  <textarea
    id="description"
    className="w-full p-2 border rounded min-h-[80px]"
    value={formData.description}
    onChange={(e) => handleInputChange('description', e.target.value)}
    placeholder={isRealtorCategory ? 'Введите имя и фамилию' : 'Описание объекта'}
    disabled={!canEditField('description')}
  />
</div>
          </div>

          {/* Photos - Full width - optional for Realtor category */}
          {(!isRealtorCategory || (currentPhotos && currentPhotos.length > 0)) && (
            <div className="mt-2">
              <div className="mb-2 text-sm font-medium text-gray-700">
                Фотографии ({currentPhotos.length})
              </div>
              <PhotoUploader 
                photos={currentPhotos}
                onChange={handlePhotosChange}
                maxPhotos={20}
              />
            </div>
          )}

          {/* Property History - Show for existing properties to all roles except AGENT */}
          {propertyId && session?.user?.role !== 'AGENT' && (
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                size="sm"
                className="mb-4"
              >
                {showHistory ? 'Скрыть историю' : 'Показать историю'}
              </Button>
              
              {showHistory && (
                <PropertyHistory 
                  propertyId={propertyId} 
                  className="border-t pt-4"
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-0">
            {propertyId && (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
              <Button
                type="button"
                variant={property?.isArchived ? 'outline' : 'destructive'}
                onClick={handleArchiveRestore}
                size="sm"
                disabled={archiveLoading}
              >
                {archiveLoading
                  ? 'Обработка...'
                  : property?.isArchived
                    ? 'Восстановить'
                    : 'В архив'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel} size="sm">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}