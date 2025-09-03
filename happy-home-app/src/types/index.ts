// UserRole enum type from Prisma schema
type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER'

import { DefaultSession } from 'next-auth'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
  }
}

// Application types
export interface PropertyFilter {
  category?: string[]
  district?: string[]
  street?: string[]
  status?: string[]
  priceMin?: number
  priceMax?: number
  areaMin?: number
  areaMax?: number
  rooms?: number[]
}

export interface BuildingInfo {
  id: string
  street: string
  houseNumber: string
  yearBuilt?: number
  wallMaterial?: string
  layout?: string
  totalFloors?: number
  hasElevator: boolean
}

export interface PropertyFormData {
  categoryId: string
  districtId: string
  buildingId: string
  apartment?: string
  floor?: number
  totalArea?: number
  livingArea?: number
  kitchenArea?: number
  rooms?: number
  ceilingHeight?: number
  balcony: boolean
  loggia: boolean
  renovation: string
  price?: number
  pricePerSqm?: number
  status: string
  description?: string
  notes?: string
}