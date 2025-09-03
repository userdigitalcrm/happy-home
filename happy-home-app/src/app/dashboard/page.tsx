'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import * as Dialog from '@radix-ui/react-dialog'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Upload, TestTube, ChevronUp, ChevronDown } from 'lucide-react'
import PropertyForm from '@/components/PropertyForm'

// Add sort state types
type SortField = 'category' | 'district' | 'price' | 'layout' | 'floor' | 'totalFloors' | 'wallMaterial' | 'totalArea' | 'kitchenArea' | 'balcony' | 'pField' | 'condition' | 'street' | 'houseApartment' | 'yearBuilt' | 'phone' | 'source' | 'description' | 'photos' | 'createdAt' | 'updatedAt' | null;
type SortDirection = 'asc' | 'desc' | null;

// Constants - Updated to match PropertyForm values
const CATEGORIES = ['Квартира', 'Дом', 'Участок', 'Коммерция', 'Гараж']
const DISTRICTS = [
  'Вокзал', 'Подгора', 'Рахмет', '20 Мкр', 'Колхозный', 'Бензострой',
  '2 Гор Бол', 'Скиф', 'ДБС', 'ВВИ', 'Северный', 'Рабочий',
  '19 Мкр', 'Азия', 'Буратино', 'Горотдел', 'ДСР', 'Уют',
  'Океан', '8 Школа', 'ДОБ', 'Дельфин', '17 Школа', 'Новый ЦОТ',
  'Сокол', 'Атлантида', 'Тайга', 'Берёзка', '3 Гор Бол', 'Черемушки',
  'Казахтелеком', 'Мастер', 'ЦОН', 'Дошкольник', 'Рахат', 'Новая Мечеть',
  'Бэст', '3 Баня', 'СКГУ', 'Ахтамар', 'Динамо', 'Радужный',
  'Мясокомбинат', 'Борки', 'Старт', 'Драм Театр Погодина', 'Достык Молл',
  '7 Школа', 'Гор Парк', 'Центральный'
]
const CONDITIONS = [
  'рем', 'евро', 'б/рем', 'косм.рем', 'хор.сост', 'кап.рем', 'част.рем', 'обыч',
  'от застройщика', 'от застр', 'рем от застр', 'предчистовая', 'черновая', 'ул черновая', 'чистовая отделка',
  'ух', 'впс', 'пв', 'св', 'нп', 'ст.двери', 'ламинат', 'лин', 'стол', 'меб', 'кух.гарн',
  'конд', 'быт.техн', 'студия', 'потол. плтк', 'сант', 'каф', 'б/каф', 'каф. совр',
  'декор панель', 'стар каф', 'пвх разв', 'с/у разд', 'с/у совм', 'пу', 'п/план',
  'п/план уз', 'п/план н/у', 'залог', 'б/залог', 'по', 'улучшенная', 'кухня', 'пвх', 'кл'
]
const WALL_MATERIALS = ['к', 'п', 'д', 'м', 'б', 'ш', 'с/ш', 'н/с']
const LAYOUTS = ['нов', 'нвст', 'ст', 'ул', 'лен', 'омс', 'гост', 'общ', 'дом', 'кот', 'бар', 'сад']
const BALCONY_OPTIONS = ['лдж', 'блк', '2 блк', 'лдж/нз', 'лдж/здо', 'лдж/зпо', 'блк/здо', 'блк/зпо', 'блк/нз', 'без', '1лдж1блк', '2блк', '3блк']
const P_FIELD_OPTIONS = ['н', 'т', 'у']
const STATUSES = [
  { value: 'ACTIVE', label: 'в продаже' },
  { value: 'RESERVED', label: 'задаток' },
  { value: 'SUSPENDED', label: 'приостановленно' },
  { value: 'SOLD', label: 'продано' },
  { value: 'RENTED', label: 'снято с продажи' }
]

interface Property {
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
  status: 'ACTIVE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'SUSPENDED'
  isArchived: boolean
  description: string | null
  notes: string | null
  createdById: string
  assignedToId: string | null
  createdAt: string
  updatedAt: string
  pField: string | null
  photos: string[]
  callAssignments?: { id: string; isCalled: boolean; agentId: string }[]
  assignedTo?: { id: string; name?: string; email: string } | null
  createdBy?: { id: string; name?: string; email: string } | null
  category?: { id: string; name: string } | string
  district?: { id: string; name: string } | string
  building?: {
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
  // Additional properties that were in the original interface
  material: string | null
  parking: boolean
}

interface Agent {
  id: string
  name?: string
  email: string
}

interface Category {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface District {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface Filters {
  category: string[]
  district: string[]
  price: [number, number]
  layout: string[]
  floor: [number, number]
  material: string[]
  totalArea: [number, number]
  kitchenArea: [number, number]
  balcony: boolean | null
  parking: boolean | null
  condition: string[]
  street: string
  houseNumber: string
  yearBuilt: [number, number]
  phone: string
  source: string[]
  description: string
  createdAt: [string, string]
  updatedAt: [string, string]
  status: string[]
  wallMaterial: string[]
  pField: string[]
  balconyType: string[]
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedProps, setSelectedProps] = useState<string[]>([])
  const [bulkSelectMode, setBulkSelectMode] = useState(false)

  // Separate pinned properties for agents
  const [pinnedProperties, setPinnedProperties] = useState<Property[]>([])

  // Tag-based filter states
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedWallMaterials, setSelectedWallMaterials] = useState<string[]>([])
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([])
  const [selectedBalconyTypes, setSelectedBalconyTypes] = useState<string[]>([])
  const [selectedPFields, setSelectedPFields] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  
  // Показывать/скрывать выпадающие списки
  const [showDistrictOptions, setShowDistrictOptions] = useState(false)
  const [showLayoutOptions, setShowLayoutOptions] = useState(false)
  const [showWallMaterialOptions, setShowWallMaterialOptions] = useState(false)
  const [showBalconyOptions, setShowBalconyOptions] = useState(false)
  const [showPFieldOptions, setShowPFieldOptions] = useState(false)
  const [showConditionOptions, setShowConditionOptions] = useState(false)
  const [showStatusOptions, setShowStatusOptions] = useState(false)
  const [showCategoryOptions, setShowCategoryOptions] = useState(false)

  const [filters, setFilters] = useState<Filters>({
    category: [],
    district: [],
    price: [0, 10000000],
    layout: [],
    floor: [1, 30],
    material: [],
    totalArea: [0, 500],
    kitchenArea: [0, 100],
    balcony: null,
    parking: null,
    condition: [],
    street: '',
    houseNumber: '',
    yearBuilt: [1950, new Date().getFullYear()],
    phone: '',
    source: [],
    description: '',
    createdAt: ['', ''],
    updatedAt: ['', ''],
    status: [],
    wallMaterial: [],
    pField: [],
    balconyType: []
  })

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: null,
    direction: null
  });

  // Refs for tag suggestions
  const conditionRef = useRef<HTMLDivElement>(null)
  const districtRef = useRef<HTMLDivElement>(null)
  const wallMaterialRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  const balconyRef = useRef<HTMLDivElement>(null)
  const pFieldRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  // Add event listener for Ctrl key for bulk selection only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use Ctrl key for bulk selection mode
      if (e.ctrlKey) setBulkSelectMode(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      // Release bulk selection mode when Ctrl is released
      if (!e.ctrlKey) setBulkSelectMode(false);
    };
    
    // Check if window is defined (client-side only)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, []);

  // Add click outside handler for filter suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conditionRef.current && !conditionRef.current.contains(event.target as Node)) {
        setShowConditionOptions(false);
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictOptions(false);
      }
      if (wallMaterialRef.current && !wallMaterialRef.current.contains(event.target as Node)) {
        setShowWallMaterialOptions(false);
      }
      if (layoutRef.current && !layoutRef.current.contains(event.target as Node)) {
        setShowLayoutOptions(false);
      }
      if (balconyRef.current && !balconyRef.current.contains(event.target as Node)) {
        setShowBalconyOptions(false);
      }
      if (pFieldRef.current && !pFieldRef.current.contains(event.target as Node)) {
        setShowPFieldOptions(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusOptions(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProperties();
      loadAgents();
      loadCategories();
      loadDistricts();
    }
  }, [status, page, showArchived]);

  // Add function to load properties with call assignments for current user
  const loadProperties = async () => {
    try {
      setLoading(true)
      // Only include filters that have actual values
      const activeFilters: Record<string, string | string[]> = {}
      
      // Add filters only if they have values
      if (filters.category.length > 0) {
        activeFilters.category = filters.category.join(',')
      }
      
      if (selectedDistricts.length > 0) {
        activeFilters.district = selectedDistricts.join(',')
      }
      
      if (filters.price[0] !== 0 || filters.price[1] !== 10000000) {
        activeFilters.price = `${filters.price[0]},${filters.price[1]}`
      }
      
      if (selectedLayouts.length > 0) {
        activeFilters.layout = selectedLayouts.join(',')
      }
      
      if (filters.floor[0] !== 1 || filters.floor[1] !== 30) {
        activeFilters.floor = `${filters.floor[0]},${filters.floor[1]}`
      }
      
      if (filters.totalArea[0] !== 0 || filters.totalArea[1] !== 500) {
        activeFilters.totalArea = `${filters.totalArea[0]},${filters.totalArea[1]}`
      }
      
      if (filters.kitchenArea[0] !== 0 || filters.kitchenArea[1] !== 100) {
        activeFilters.kitchenArea = `${filters.kitchenArea[0]},${filters.kitchenArea[1]}`
      }
      
      if (filters.wallMaterial.length > 0) {
        activeFilters.wallMaterial = filters.wallMaterial.join(',')
      }
      
      if (filters.balconyType.length > 0) {
        activeFilters.balconyType = filters.balconyType.join(',')
      }
      
      if (filters.pField.length > 0) {
        activeFilters.pField = filters.pField.join(',')
      }
      
      if (selectedConditions.length > 0) {
        activeFilters.condition = selectedConditions.join(',')
      }
      
      if (filters.street) {
        activeFilters.street = filters.street
      }
      
      if (filters.houseNumber) {
        activeFilters.houseNumber = filters.houseNumber
      }
      
      if (filters.yearBuilt[0] !== 1950 || filters.yearBuilt[1] !== new Date().getFullYear()) {
        activeFilters.yearBuilt = `${filters.yearBuilt[0]},${filters.yearBuilt[1]}`
      }
      
      if (filters.phone) {
        activeFilters.phone = filters.phone
      }
      
      if (filters.source.length > 0) {
        activeFilters.source = filters.source.join(',')
      }
      
      if (filters.description) {
        activeFilters.description = filters.description
      }
      
      if (selectedStatuses.length > 0) {
        activeFilters.status = selectedStatuses.join(',')
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        includeArchived: showArchived.toString(),
        ...activeFilters
      })

      const response = await fetch(`/api/properties?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setProperties(data.properties || [])
        setTotalPages(data.totalPages || 1)
        
        // Update pinned properties for agents
        if (session?.user?.role === 'AGENT') {
          // Filter pinned properties from the loaded properties
          // Pinned properties are those with callAssignments where isCalled is false
          const pinned = (data.properties || []).filter((property: Property) => 
            property.callAssignments?.some((ca: any) => 
              ca.agentId === session.user.id && !ca.isCalled
            )
          )
          setPinnedProperties(pinned)
        }
      } else {
        setError(data.error || 'Ошибка загрузки')
      }
    } catch (err) {
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/users?role=AGENT')
      const data = await response.json()
      if (response.ok) {
        console.log('Loaded agents:', data) // Для отладки
        setAgents(data || [])
      } else {
        console.error('Error loading agents:', data.error)
      }
    } catch (err) {
      console.error('Error loading agents:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/districts')
      const data = await response.json()
      if (response.ok) {
        setDistricts(data || [])
      }
    } catch (err) {
      console.error('Error loading districts:', err)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // Tag-based filter handlers
  const handleConditionTagClick = (condition: string) => {
    const newSelected = selectedConditions.includes(condition)
      ? selectedConditions.filter(c => c !== condition)
      : [...selectedConditions, condition]
    
    setSelectedConditions(newSelected)
    handleFilterChange('condition', newSelected)
  }

  const handleDistrictTagClick = (district: string) => {
    const newSelected = selectedDistricts.includes(district)
      ? selectedDistricts.filter(d => d !== district)
      : [...selectedDistricts, district]
    
    setSelectedDistricts(newSelected)
    handleFilterChange('district', newSelected)
  }

  const handleWallMaterialTagClick = (material: string) => {
    const newSelected = selectedWallMaterials.includes(material)
      ? selectedWallMaterials.filter(m => m !== material)
      : [...selectedWallMaterials, material]
    
    setSelectedWallMaterials(newSelected)
    handleFilterChange('wallMaterial', newSelected)
  }

  const handleLayoutTagClick = (layout: string) => {
    const newSelected = selectedLayouts.includes(layout)
      ? selectedLayouts.filter(l => l !== layout)
      : [...selectedLayouts, layout]
    
    setSelectedLayouts(newSelected)
    handleFilterChange('layout', newSelected)
  }

  const handleBalconyTagClick = (balcony: string) => {
    const newSelected = selectedBalconyTypes.includes(balcony)
      ? selectedBalconyTypes.filter(b => b !== balcony)
      : [...selectedBalconyTypes, balcony]
    
    setSelectedBalconyTypes(newSelected)
    handleFilterChange('balconyType', newSelected)
  }

  const handlePFieldTagClick = (pField: string) => {
    const newSelected = selectedPFields.includes(pField)
      ? selectedPFields.filter(p => p !== pField)
      : [...selectedPFields, pField]
    
    setSelectedPFields(newSelected)
    handleFilterChange('pField', newSelected)
  }

  const handleStatusTagClick = (status: string) => {
    const newSelected = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    
    setSelectedStatuses(newSelected)
    handleFilterChange('status', newSelected)
  }

  const handleAssign = async () => {
    if (!selectedAgent || selectedProps.length === 0) return
    
    try {
      const response = await fetch('/api/call-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds: selectedProps,
          agentId: selectedAgent
        })
      })
      
      if (response.ok) {
        setShowAssignDialog(false)
        setSelectedAgent('')
        setSelectedProps([])
        loadProperties()
      } else {
        const errorData = await response.json();
        console.error('Error assigning properties:', errorData.error);
      }
    } catch (err) {
      console.error('Error assigning properties:', err)
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch('/api/properties/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds: selectedProps })
      });
      if (response.ok) {
        setSelectedProps([]);
        loadProperties();
      }
    } catch (err) {
      console.error('Error archiving properties:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/properties/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds: selectedProps })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'properties.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Error exporting properties:', err);
    }
  };

  // Add sorting function
  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.field === field && sortConfig.direction === 'desc') {
      direction = null;
    }
    
    setSortConfig({ field, direction });
  };

  const canCreateProperty = () => {
    return session?.user?.role === 'ADMIN' || 
           session?.user?.role === 'MANAGER' || 
           session?.user?.role === 'AGENT'
  }

  const canViewProperty = (property: Property) => {
    if (!session?.user?.role) return false;
    
    // USER role has read-only access and can't view property details
    if (session.user.role === 'USER') {
      return false;
    }
    
    if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
      return true
    }
    if (session.user.role === 'AGENT') {
      return property.assignedTo?.email === session.user.email || 
             property.createdBy?.email === session.user.email
    }
    return false
  }

  const canViewArchive = () => {
    return session?.user?.role === 'ADMIN' || 
           session?.user?.role === 'MANAGER'
  }

  const canViewHistory = () => {
    return session?.user?.role === 'ADMIN' || 
           session?.user?.role === 'MANAGER'
  }

  // Filter properties based on user role
  const filteredProperties = useMemo(() => {
    // USER role can only see non-archived properties
    if (session?.user?.role === 'USER') {
      return properties.filter(p => !p.isArchived);
    }
    return properties;
  }, [properties, session?.user?.role]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) return filteredProperties;
    
    return [...filteredProperties].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Get values based on sort field
      switch (sortConfig.field) {
        case 'category':
          aValue = typeof a.category === 'object' && a.category !== null ? a.category.name : (typeof a.category === 'string' ? a.category : '');
          bValue = typeof b.category === 'object' && b.category !== null ? b.category.name : (typeof b.category === 'string' ? b.category : '');
          break;
        case 'district':
          aValue = typeof a.district === 'object' && a.district !== null ? a.district.name : (typeof a.district === 'string' ? a.district : '');
          bValue = typeof b.district === 'object' && b.district !== null ? b.district.name : (typeof b.district === 'string' ? b.district : '');
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'layout':
          aValue = a.layout || '';
          bValue = b.layout || '';
          break;
        case 'floor':
          aValue = a.floor || 0;
          bValue = b.floor || 0;
          break;
        case 'totalFloors':
          aValue = a.totalFloors || 0;
          bValue = b.totalFloors || 0;
          break;
        case 'wallMaterial':
          aValue = a.building?.wallMaterial || '';
          bValue = b.building?.wallMaterial || '';
          break;
        case 'totalArea':
          aValue = a.totalArea || 0;
          bValue = b.totalArea || 0;
          break;
        case 'kitchenArea':
          aValue = a.kitchenArea || 0;
          bValue = b.kitchenArea || 0;
          break;
        case 'balcony':
          aValue = a.balcony || '';
          bValue = b.balcony || '';
          break;
        case 'pField':
          aValue = a.pField || '';
          bValue = b.pField || '';
          break;
        case 'condition':
          aValue = a.condition || '';
          bValue = b.condition || '';
          break;
        case 'street':
          aValue = a.building?.street || '';
          bValue = b.building?.street || '';
          break;
        case 'houseApartment':
          aValue = `${a.building?.houseNumber || ''}${a.apartment ? `-${a.apartment}` : ''}`;
          bValue = `${b.building?.houseNumber || ''}${b.apartment ? `-${b.apartment}` : ''}`;
          break;
        case 'yearBuilt':
          aValue = a.yearBuilt || 0;
          bValue = b.yearBuilt || 0;
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'source':
          aValue = a.source || '';
          bValue = b.source || '';
          break;
        case 'description':
          aValue = a.description || '';
          bValue = b.description || '';
          break;
        case 'photos':
          aValue = a.photos?.length || 0;
          bValue = b.photos?.length || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }
      
      // Handle sorting based on data type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Text sorting
        const comparison = aValue.localeCompare(bValue, 'ru');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } else {
        // Numeric sorting
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  }, [filteredProperties, sortConfig]);

  // All hooks must be called before any conditional returns
  // Move conditional rendering to the render phase, not before hooks
  const shouldShowLoading = status === 'loading' || loading;
  const shouldRedirect = status === 'unauthenticated';

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green-primary"></div>
      </div>
    )
  }

  if (shouldRedirect) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full width */}
      <div className="bg-white border-b border-gray-200 w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Счастливый Дом" 
                  className="w-20 h-20"
                />
              </div>
              <div className="ml-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Счастливый Дом
                  </h1>
                  <p className="text-xs text-brand-green-dark/70 font-medium tracking-wide uppercase mt-1">
                    АГЕНТСТВО НЕДВИЖИМОСТИ
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER' || session?.user?.role === 'AGENT') && (
                  <>
                    {bulkSelectMode && selectedProps.length > 0 && (
                      <Badge variant="outline" className="px-2 py-0 text-xs">
                        {selectedProps.length}
                      </Badge>
                    )}
                    <label className="flex items-center text-sm gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="accent-brand-green-primary"
                        checked={showArchived}
                        onChange={(e) => {
                          setShowArchived(e.target.checked)
                          setPage(1)
                        }}
                      />
                      Архив
                    </label>
                  </>
                )}
              </div>
              {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/archived')}
                  className="border-yellow-300 text-yellow-600 hover:bg-yellow-50 font-medium px-3 py-2 rounded-lg text-sm"
                >
                  Архив
                </Button>
              )}
              
              <div className="text-sm text-gray-700">
                <span className="font-medium text-brand-green-dark">{session?.user?.name || 'Пользователь'}</span>
                <span className="text-gray-500 ml-2">({session?.user?.role || 'USER'})</span>
              </div>
              
              {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-brand-gold-gradient text-brand-green-dark hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-semibold px-4 py-2 rounded-lg border-0 text-sm"
                >
                  + Добавить объект
                </Button>
              )}
              
              {session?.user?.role === 'ADMIN' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/admin')}
                    className="border-brand-green-primary text-brand-green-primary hover:bg-brand-green-primary/10 font-medium px-3 py-2 rounded-lg text-sm"
                  >
                    Админ
                  </Button>                </>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-3 py-2 rounded-lg text-sm"
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full width container */}
      <div className="w-full px-0 py-2">
        {/* Table Container */}
        <div className="w-full overflow-hidden px-0">
          {/* Filters aligned with table columns */}
          <div className="mb-4 overflow-x-auto px-2" style={{ minWidth: '100%' }}>
            {/* Responsive filter grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9 gap-2 px-2 mb-3">
              {/* Bulk select placeholder */}
              {bulkSelectMode && <div></div>}
              {/* Category filter */}
              <div className="w-32">
                <Label className="text-xs mb-1 block">Категория</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowCategoryOptions(!showCategoryOptions)}
                  >
                    {filters.category.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">
                          {filters.category.map(catId => {
                            const category = categories.find(c => c.id === catId);
                            return category ? category.name : catId;
                          }).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>
                  
                  {showCategoryOptions && (
                    <div className="fixed z-[100] mt-1 w-40 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {filters.category.map(catId => {
                          const category = categories.find(c => c.id === catId);
                          return category ? (
                            <Badge 
                              key={catId} 
                              variant="secondary" 
                              className="cursor-pointer text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newCategories = filters.category.filter(id => id !== catId);
                                handleFilterChange('category', newCategories);
                              }}
                            >
                              {category.name} <X className="ml-1 h-2 w-2" />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {categories.map(category => (
                          <div
                            key={category.id}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${filters.category.includes(category.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCategories = filters.category.includes(category.id)
                                ? filters.category.filter(id => id !== category.id)
                                : [...filters.category, category.id];
                              handleFilterChange('category', newCategories);
                              setShowCategoryOptions(false);
                            }}
                          >
                            {category.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* District filter */}
              <div className="w-32">
                <Label className="text-xs mb-1 block">Район</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowDistrictOptions(!showDistrictOptions)}
                  >
                    {selectedDistricts.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">{selectedDistricts.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>

                  {showDistrictOptions && (
                    <div className="fixed z-[100] mt-1 w-48 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedDistricts.map(district => (
                          <Badge 
                            key={district} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => handleDistrictTagClick(district)}
                          >
                            {district} <X className="ml-1 h-2 w-2" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {DISTRICTS.map(district => (
                          <div
                            key={district}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${selectedDistricts.includes(district) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => handleDistrictTagClick(district)}
                          >
                            {district}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Price filter */}
              <div className="w-36">
                <Label className="text-xs mb-1 block">Цена от-до</Label>
                <div className="flex space-x-1">
                  <input 
                    type="number" 
                    value={filters.price[0]} 
                    onChange={e => handleFilterChange('price', [Number(e.target.value), filters.price[1]])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                  <input 
                    type="number" 
                    value={filters.price[1]} 
                    onChange={e => handleFilterChange('price', [filters.price[0], Number(e.target.value)])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                </div>
              </div>

              {/* Layout filter */}
              <div className="w-28">
                <Label className="text-xs mb-1 block">Планировка</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowLayoutOptions(!showLayoutOptions)}
                  >
                    {selectedLayouts.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">{selectedLayouts.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>

                  {showLayoutOptions && (
                    <div className="fixed z-[100] mt-1 w-40 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedLayouts.map(layout => (
                          <Badge 
                            key={layout} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => handleLayoutTagClick(layout)}
                          >
                            {layout} <X className="ml-1 h-2 w-2" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {LAYOUTS.map(layout => (
                          <div
                            key={layout}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${selectedLayouts.includes(layout) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => handleLayoutTagClick(layout)}
                          >
                            {layout}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Floor filter */}
              <div className="w-36">
                <Label className="text-xs mb-1 block">Этаж от-до</Label>
                <div className="flex space-x-1">
                  <input 
                    type="number" 
                    value={filters.floor[0]} 
                    onChange={e => handleFilterChange('floor', [Number(e.target.value), filters.floor[1]])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                  <input 
                    type="number" 
                    value={filters.floor[1]} 
                    onChange={e => handleFilterChange('floor', [filters.floor[0], Number(e.target.value)])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                </div>
              </div>
              
              {/* Total floors filter */}
              <div className="w-20">
                <Label className="text-xs mb-1 block">Этажность</Label>
                <input 
                  type="number" 
                  value={filters.floor[0] || ''} 
                  onChange={e => handleFilterChange('floor', [Number(e.target.value), Number(e.target.value)])} 
                  className="w-full h-8 px-1 border rounded text-xs" 
                  placeholder=""
                />
              </div>
              {/* Wall material filter */}
              <div className="w-20">
                <Label className="text-xs mb-1 block">Материал</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowWallMaterialOptions(!showWallMaterialOptions)}
                  >
                    {selectedWallMaterials.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">{selectedWallMaterials.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>

                  {showWallMaterialOptions && (
                    <div className="fixed z-[100] mt-1 w-32 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedWallMaterials.map(material => (
                          <Badge 
                            key={material} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => handleWallMaterialTagClick(material)}
                          >
                            {material} <X className="ml-1 h-2 w-2" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {WALL_MATERIALS.map(material => (
                          <div
                            key={material}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${selectedWallMaterials.includes(material) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => handleWallMaterialTagClick(material)}
                          >
                            {material}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Total area filter */}
              <div className="w-36">
                <Label className="text-xs mb-1 block">Площадь от-до</Label>
                <div className="flex space-x-1">
                  <input 
                    type="number" 
                    value={filters.totalArea[0]} 
                    onChange={e => handleFilterChange('totalArea', [Number(e.target.value), filters.totalArea[1]])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                  <input 
                    type="number" 
                    value={filters.totalArea[1]} 
                    onChange={e => handleFilterChange('totalArea', [filters.totalArea[0], Number(e.target.value)])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                </div>
              </div>
              
              {/* Kitchen area filter */}
              <div className="w-36">
                <Label className="text-xs mb-1 block">Площадь кухни</Label>
                <div className="flex space-x-1">
                  <input 
                    type="number" 
                    value={filters.kitchenArea[0]} 
                    onChange={e => handleFilterChange('kitchenArea', [Number(e.target.value), filters.kitchenArea[1]])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder="От"
                  />
                  <input 
                    type="number" 
                    value={filters.kitchenArea[1]} 
                    onChange={e => handleFilterChange('kitchenArea', [filters.kitchenArea[0], Number(e.target.value)])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder="До"
                  />
                </div>
              </div>
              {/* Balcony filter */}
              <div className="w-24">
                <Label className="text-xs mb-1 block">Балкон</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowBalconyOptions(!showBalconyOptions)}
                  >
                    {selectedBalconyTypes.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">{selectedBalconyTypes.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>

                  {showBalconyOptions && (
                    <div className="fixed z-[100] mt-1 w-36 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedBalconyTypes.map(balcony => (
                          <Badge 
                            key={balcony} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => handleBalconyTagClick(balcony)}
                          >
                            {balcony} <X className="ml-1 h-2 w-2" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {BALCONY_OPTIONS.map(option => (
                          <div
                            key={option}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${selectedBalconyTypes.includes(option) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => handleBalconyTagClick(option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* P field filter */}
              <div className="w-20">
                <Label className="text-xs mb-1 block">Положение</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowPFieldOptions(!showPFieldOptions)}
                  >
                    {selectedPFields.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">{selectedPFields.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>

                  {showPFieldOptions && (
                    <div className="fixed z-[100] mt-1 w-32 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedPFields.map(pField => (
                          <Badge 
                            key={pField} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => handlePFieldTagClick(pField)}
                          >
                            {pField} <X className="ml-1 h-2 w-2" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {P_FIELD_OPTIONS.map(option => (
                          <div
                            key={option}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${selectedPFields.includes(option) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => handlePFieldTagClick(option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Condition filter */}
              <div className="w-32">
                <Label className="text-xs mb-1 block">Состояние</Label>
                <div className="relative">
                  <div 
                    className="border rounded h-8 px-2 flex items-center text-xs cursor-pointer overflow-hidden" 
                    onClick={() => setShowConditionOptions(!showConditionOptions)}
                  >
                    {selectedConditions.length > 0 ? (
                      <div className="flex items-center overflow-hidden">
                        <span className="truncate">{selectedConditions.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400"></span>
                    )}
                  </div>

                  {showConditionOptions && (
                    <div className="fixed z-[100] mt-1 w-48 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto p-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedConditions.map(condition => (
                          <Badge 
                            key={condition} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => handleConditionTagClick(condition)}
                          >
                            {condition} <X className="ml-1 h-2 w-2" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {CONDITIONS.map(condition => (
                          <div
                            key={condition}
                            className={`px-2 py-1 text-xs cursor-pointer rounded ${selectedConditions.includes(condition) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => handleConditionTagClick(condition)}
                          >
                            {condition}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Street filter */}
              <div className="w-28">
                <Label className="text-xs mb-1 block">Улица</Label>
                <input 
                  type="text" 
                  value={filters.street} 
                  onChange={e => handleFilterChange('street', e.target.value)} 
                  className="w-full h-8 px-2 border rounded text-xs" 
                  placeholder=""
                />
              </div>
              
              {/* House number filter */}
              <div className="w-20">
                <Label className="text-xs mb-1 block">Номер дома</Label>
                <input 
                  type="text" 
                  value={filters.houseNumber} 
                  onChange={e => handleFilterChange('houseNumber', e.target.value)} 
                  className="w-full h-8 px-2 border rounded text-xs" 
                  placeholder=""
                />
              </div>
              
              {/* Year built filter */}
              <div className="w-36">
                <Label className="text-xs mb-1 block">Год от-до</Label>
                <div className="flex space-x-1">
                  <input 
                    type="number" 
                    value={filters.yearBuilt[0]} 
                    onChange={e => handleFilterChange('yearBuilt', [Number(e.target.value), filters.yearBuilt[1]])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                  <input 
                    type="number" 
                    value={filters.yearBuilt[1]} 
                    onChange={e => handleFilterChange('yearBuilt', [filters.yearBuilt[0], Number(e.target.value)])} 
                    className="w-full h-8 px-1 border rounded text-xs" 
                    placeholder=""
                  />
                </div>
              </div>
              
              {/* Phone filter */}
              <div className="shrink-0 w-20">
                <Label className="text-xs mb-0 block">Телефон</Label>
                <input 
                  type="text" 
                  value={filters.phone} 
                  onChange={e => handleFilterChange('phone', e.target.value)} 
                  className="w-full h-8 px-2 border rounded text-xs" 
                  placeholder=""
                />
              </div>
              
              {/* Source filter */}
              <div className="w-28">
                <Label className="text-xs mb-1 block">Источник</Label>
                <input 
                  type="text" 
                  value={filters.source.length > 0 ? filters.source[0] : ''} 
                  onChange={e => handleFilterChange('source', e.target.value ? [e.target.value] : [])} 
                  className="w-full h-8 px-2 border rounded text-xs" 
                  placeholder=""
                />
              </div>
              
              {/* Apply/Clear buttons */}
              <div className="flex flex-col justify-end pb-1 w-40 ml-auto">
                <div className="flex space-x-1">
                  <Button onClick={loadProperties} className="h-8 px-2 py-0 text-xs">
                    Применить
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilters({
                        category: [],
                        district: [],
                        price: [0, 10000000],
                        layout: [],
                        floor: [1, 30],
                        material: [],
                        totalArea: [0, 500],
                        kitchenArea: [0, 100],
                        balcony: null,
                        parking: null,
                        condition: [],
                        street: '',
                        houseNumber: '',
                        yearBuilt: [1950, new Date().getFullYear()],
                        phone: '',
                        source: [],
                        description: '',
                        createdAt: ['', ''],
                        updatedAt: ['', ''],
                        status: [],
                        wallMaterial: [],
                        pField: [],
                        balconyType: []
                      });
                      setSelectedConditions([]);
                      setSelectedDistricts([]);
                      setSelectedWallMaterials([]);
                      setSelectedLayouts([]);
                      setSelectedBalconyTypes([]);
                      setSelectedPFields([]);
                      setSelectedStatuses([]);
                      loadProperties();
                    }} 
                    className="h-8 px-2 py-0 text-xs"
                  >
                    Очистить
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {selectedProps.length > 0 && (
            <div className="flex gap-2 mb-4 p-4 bg-white rounded-lg shadow-md">
              <Button onClick={() => setShowAssignDialog(true)} className="bg-blue-500 hover:bg-blue-600">Назначить</Button>
            </div>
          )}
          
          <div className="bg-white">
            <div className="w-full">
              <div className="overflow-x-auto px-0" style={{ overflowY: 'hidden' }}>
                <table className="w-full text-sm table-fixed bg-white rounded-lg shadow-md border-collapse mx-0" style={{ tableLayout: 'fixed', width: 'calc(100vw - 15px)' }}>
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-center uppercase text-xs font-bold text-gray-700 whitespace-nowrap">
                      {bulkSelectMode && <th className="w-8 p-2 px-2 border border-gray-200">ВЫБОР</th>}
                      <th className="w-12 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('category')}>
                        <span className="inline-block transform scale-110 mx-auto">КАТ</span> {sortConfig.field === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-16 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('district')}>
                        <span className="inline-block transform scale-110 mx-auto">РАЙОН</span> {sortConfig.field === 'district' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-10 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('price')}>
                        <span className="inline-block transform scale-110 mx-auto">ЦЕНА</span> {sortConfig.field === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('layout')}>
                        <span className="inline-block transform scale-110 mx-auto">ПЛАН</span> {sortConfig.field === 'layout' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('floor')}>
                        <span className="inline-block transform scale-110 mx-auto">ЭТ</span> {sortConfig.field === 'floor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('totalFloors')}>
                        <span className="inline-block transform scale-110 mx-auto">ЭТЬ</span> {sortConfig.field === 'totalFloors' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('wallMaterial')}>
                        <span className="inline-block transform scale-110 mx-auto">М</span> {sortConfig.field === 'wallMaterial' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('totalArea')}>
                        <span className="inline-block transform scale-110 mx-auto">S</span> {sortConfig.field === 'totalArea' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-1 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('kitchenArea')}>
                        <span className="inline-block transform scale-110 mx-auto">Sкх</span> {sortConfig.field === 'kitchenArea' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-12 p-2 px-1 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('balcony')}>
                        <span className="inline-block transform scale-110 mx-auto">БЛКН</span> {sortConfig.field === 'balcony' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('pField')}>
                        <span className="inline-block transform scale-110 mx-auto">П</span> {sortConfig.field === 'pField' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-20 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('condition')}>
                        <span className="inline-block transform scale-110 mx-auto">СОСТ</span> {sortConfig.field === 'condition' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-16 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('street')}>
                        <span className="inline-block transform scale-110 mx-auto">УЛИЦА</span> {sortConfig.field === 'street' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-10 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('houseApartment')}>
                        <span className="inline-block transform scale-110 mx-auto">Д-КВ</span> {sortConfig.field === 'houseApartment' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-6 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('yearBuilt')}>
                        <span className="inline-block transform scale-110 mx-auto">ГОД</span> {sortConfig.field === 'yearBuilt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-16 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('phone')}>
                        <span className="inline-block transform scale-110 mx-auto">ТЕЛЕФОН</span> {sortConfig.field === 'phone' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-16 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('source')}>
                        <span className="inline-block transform scale-110 mx-auto">ИСТОЧНИК</span> {sortConfig.field === 'source' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-20 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('description')}>
                        <span className="inline-block transform scale-110 mx-auto">ОПИСАНИЕ</span> {sortConfig.field === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-4 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('photos')}>
                        <span className="inline-block transform scale-110 mx-auto">Ф</span> {sortConfig.field === 'photos' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-12 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('createdAt')}>
                        <span className="inline-block transform scale-110 mx-auto">СОЗДАНО</span> {sortConfig.field === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="w-12 p-2 px-2 border border-gray-200 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('updatedAt')}>
                        <span className="inline-block transform scale-110 mx-auto">ИЗМЕНЕНО</span> {sortConfig.field === 'updatedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProperties.map((property, index) => (
                      <ContextMenu.Root key={property.id}>
                        <ContextMenu.Trigger asChild>
                          <tr 
                            className={`border-b transition-colors cursor-pointer text-[13px] table-row-hover ${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'} ${
                              property.phone && property.phone.split(/[\s,\n]+/).length > 1 ? 'min-h-[50px]' : ''
                            } ${
                              property.callAssignments?.some(ca => ca.agentId === session?.user?.id && !ca.isCalled && session?.user?.id) 
                                ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                                : ''
                            }`}
                            onContextMenu={(e) => {
                              // If not already in bulk select mode, start with this property
                              if (!bulkSelectMode && selectedProps.length === 0) {
                                setSelectedProps([property.id]);
                                setBulkSelectMode(true);
                              }
                            }}
                            onClick={(e) => {
                              // Handle bulk selection mode
                              if (bulkSelectMode) {
                                e.stopPropagation();
                                setSelectedProps(prev =>
                                  prev.includes(property.id)
                                    ? prev.filter(id => id !== property.id)
                                    : [...prev, property.id]
                                );
                              } else {
                                // Открываем форму редактирования при клике на строку
                                setEditingProperty(property);
                                setShowForm(true);
                              }
                            }}
                          >
                            {bulkSelectMode && (
                              <td className="p-2 border border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={selectedProps.includes(property.id)}
                                  onChange={(e) => {
                                    setSelectedProps(prev =>
                                      e.target.checked
                                        ? [...prev, property.id]
                                        : prev.filter(id => id !== property.id)
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                            )}
                            <td className="p-0 px-1 text-[13px] border border-gray-200">
                              {property.callAssignments?.some(ca => !ca.isCalled) && <Badge variant="secondary" className="mr-1 text-[10px]">Для прозвона</Badge>}
                              {typeof property.category === 'object' && property.category !== null ? property.category.name : (typeof property.category === 'string' ? property.category : '')}
                            </td>
                            <td className="p-0 px-1 text-[13px] truncate border border-gray-200">{typeof property.district === 'object' && property.district !== null ? property.district.name : (typeof property.district === 'string' ? property.district : '')}</td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200">{property.price}</td>
                            <td className="p-0 px-1 text-[13px] border border-gray-200 text-center">{property.layout}</td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200 text-center">{property.floor}</td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200 text-center">{property.totalFloors}</td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200 text-center">{property.building?.wallMaterial || ''}</td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200 w-6 text-center">{property.totalArea}</td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200 w-6 text-center">{property.kitchenArea}</td>
                            <td className="p-0 px-2 text-[15px] border border-gray-200 text-center" style={{ minWidth: '80px', maxWidth: '100px' }}>
                              <div className="truncate mx-auto" title={property.balcony || '-'}>
                                {property.balcony || '-'}
                              </div>
                            </td>
                            <td className="p-0 px-1 text-[15px] border border-gray-200 text-center">
                              <div className="truncate mx-auto" title={property.pField || '-'}>
                                {property.pField || '-'}
                              </div>
                            </td>
                            <td className="p-2 px-2 text-[13px] max-w-[100px] border border-gray-200">
                              <div className="truncate" title={property.condition || ''}>
                                {property.condition}
                              </div>
                            </td>
                            <td className="p-2 px-2 text-[13px] max-w-[100px] border border-gray-200">
                              <div className="truncate" title={property.building?.street || ''}>
                                {property.building?.street || ''}
                              </div>
                            </td>
                            <td className="p-0 px-1 text-[13px] border border-gray-200">
                              {`${property.building?.houseNumber || ''}${property.apartment ? `-${property.apartment}` : ''}`}
                            </td>
                            <td className="p-0 px-1 text-[13px] border border-gray-200">{property.yearBuilt}</td>
                            <td className="p-2 px-2 text-[13px] max-w-[120px] overflow-hidden border border-gray-200">
                              <div className="max-h-[60px] overflow-hidden">
                                {property.phone ? property.phone.split(/[\s,\n]+/).map((phone, index) => {
                                  if (index >= 5) return null; // Не более 5 телефонов
                                  return <div key={index} className="whitespace-nowrap">{phone}</div>;
                                }) : ''}
                              </div>
                            </td>
                            <td className="p-2 px-2 text-[13px] max-w-[100px] truncate border border-gray-200">
                              {property.source ? property.source.split('\n').map((link, index) => {
                                if (index >= 5) return null; // Не более 5 ссылок
                                return link.startsWith('http') ? 
                                  <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline whitespace-nowrap overflow-hidden text-ellipsis">
                                    {link.replace(/^https?:\/\//, '').substring(0, 12)}...
                                  </a> : 
                                  <span key={index} className="block whitespace-nowrap overflow-hidden text-ellipsis">
                                    {link.length > 12 ? `${link.substring(0, 12)}...` : link}
                                  </span>;
                              }) : ''}
                            </td>
                            <td className="p-2 px-2 text-[13px] max-w-[120px] border border-gray-200">
                              <div className="truncate" title={property.description || ''}>
                                {property.description}
                              </div>
                            </td>
                            <td className="p-1 px-1 text-[13px] border border-gray-200 text-center">{property.photos?.length || 0}</td>
                            <td className="p-2 px-2 text-[13px] border border-gray-200">{new Date(property.createdAt).toLocaleDateString()}</td>
                            <td className="p-2 px-2 text-[13px] border border-gray-200">{new Date(property.updatedAt).toLocaleDateString()}</td>
                          </tr>
                        </ContextMenu.Trigger>
                        <ContextMenu.Portal>
                          <ContextMenu.Content
                            className="min-w-[220px] bg-white rounded-md shadow-lg p-2 z-50 border border-gray-200"
                          >
                            <ContextMenu.Item
                              className="flex items-center px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100"
                              onSelect={(e) => {
                                e.preventDefault();
                                setEditingProperty(property);
                                setShowForm(true);
                              }}
                            >
                              Редактировать
                            </ContextMenu.Item>
                            <ContextMenu.Separator className="h-px bg-gray-200 my-1" />
                            <ContextMenu.Item
                              className="flex items-center px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100"
                              onSelect={(e) => {
                                e.preventDefault();
                                if (!selectedProps.includes(property.id)) {
                                  setSelectedProps([property.id]);
                                }
                                setShowAssignDialog(true);
                              }}
                            >
                              Назначить для прозвона
                            </ContextMenu.Item>
                            <ContextMenu.Item
                              className="flex items-center px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100"
                              onSelect={(e) => {
                                e.preventDefault();
                                // Add to selection if not already selected
                                if (!selectedProps.includes(property.id)) {
                                  setSelectedProps(prev => [...prev, property.id]);
                                }
                              }}
                            >
                              Добавить к выделению
                            </ContextMenu.Item>
                          </ContextMenu.Content>
                        </ContextMenu.Portal>
                      </ContextMenu.Root>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-4">
                <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Предыдущая</Button>
                <span>Страница {page} из {totalPages}</span>
                <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Следующая</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Dialog */}
        <Dialog.Root open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg z-50 w-80 space-y-4">
              <Dialog.Title className="text-lg font-bold">Назначить для прозвона</Dialog.Title>
              <div className="space-y-2">
                <Label htmlFor="agent">Риэлтор</Label>
                <select id="agent" className="w-full p-2 border rounded" value={selectedAgent} onChange={e=>setSelectedAgent(e.target.value)}>
                  <option value="">Выберите...</option>
                  {agents.map(a=> (<option key={a.id} value={a.id}>{a.name || a.email}</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setShowAssignDialog(false)}>Отмена</Button>
                <Button onClick={handleAssign} disabled={!selectedAgent}>Назначить</Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Property Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0">
            <div className="bg-white w-full h-full overflow-y-auto">
              <PropertyForm
                property={editingProperty as any}
                categories={categories}
                districts={districts}
                onSave={() => {
                  loadProperties()
                  setShowForm(false)
                  setEditingProperty(null)
                }}
                onCancel={() => {
                  setShowForm(false)
                  setEditingProperty(null)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}