// Справочник для автозаполнения полей на основе года постройки
// Данные проанализированы из База недвижимости.csv

export interface ReferenceData {
  wallMaterial: string
  layout: string
  condition: string
  totalFloors: number
  balcony: string
  heatingType?: string
  ceilingHeight?: number
}

export interface YearRange {
  minYear: number
  maxYear: number
  data: ReferenceData
  description: string
}

// Справочные данные на основе анализа файла ГОД ПОСТРОЙКИ.xlsx и База недвижимости.csv
export const YEAR_BUILT_REFERENCE: YearRange[] = [
  {
    minYear: 1950,
    maxYear: 1960,
    description: "Хрущевки, первые панельные дома",
    data: {
      wallMaterial: "п", // панель
      layout: "стар", // старая
      condition: "б/рем", // без ремонта
      totalFloors: 5,
      balcony: "блк", // балкон
      ceilingHeight: 2.5
    }
  },
  {
    minYear: 1961,
    maxYear: 1970,
    description: "Поздние хрущевки, улучшенные панельные дома",
    data: {
      wallMaterial: "п", // панель
      layout: "ул", // улучшенная
      condition: "косм.рем", // косметический ремонт
      totalFloors: 5,
      balcony: "блк", // балкон
      ceilingHeight: 2.6
    }
  },
  {
    minYear: 1971,
    maxYear: 1980,
    description: "Брежневки, кирпичные и панельные дома",
    data: {
      wallMaterial: "к", // кирпич
      layout: "ул", // улучшенная
      condition: "рем", // после ремонта
      totalFloors: 9,
      balcony: "блк", // балкон
      ceilingHeight: 2.7
    }
  },
  {
    minYear: 1981,
    maxYear: 1990,
    description: "Поздние советские дома, улучшенная планировка",
    data: {
      wallMaterial: "к", // кирпич
      layout: "ул", // улучшенная
      condition: "рем", // после ремонта
      totalFloors: 9,
      balcony: "лдж", // лоджия
      ceilingHeight: 2.7
    }
  },
  {
    minYear: 1991,
    maxYear: 2000,
    description: "Постсоветские дома, переходный период",
    data: {
      wallMaterial: "к", // кирпич
      layout: "нов", // новая
      condition: "рем", // после ремонта
      totalFloors: 5,
      balcony: "лдж", // лоджия
      ceilingHeight: 2.8
    }
  },
  {
    minYear: 2001,
    maxYear: 2010,
    description: "Современные дома, улучшенные материалы",
    data: {
      wallMaterial: "к", // кирпич
      layout: "нов", // новая
      condition: "рем", // после ремонта
      totalFloors: 5,
      balcony: "лдж", // лоджия
      ceilingHeight: 2.9
    }
  },
  {
    minYear: 2011,
    maxYear: 2020,
    description: "Новостройки, современные технологии",
    data: {
      wallMaterial: "монолит", // монолит
      layout: "новостр", // новостройка
      condition: "евро", // евроремонт
      totalFloors: 9,
      balcony: "лдж", // лоджия
      ceilingHeight: 3.0
    }
  },
  {
    minYear: 2021,
    maxYear: new Date().getFullYear(),
    description: "Современные новостройки, высокие стандарты",
    data: {
      wallMaterial: "монолит", // монолит
      layout: "новостр", // новостройка
      condition: "от застройщика", // от застройщика
      totalFloors: 9,
      balcony: "лдж", // лоджия
      ceilingHeight: 3.0
    }
  }
]

// Дополнительные справочные данные по районам (из анализа CSV)
export const DISTRICT_PATTERNS: { [key: string]: Partial<ReferenceData> } = {
  "Бензострой": {
    wallMaterial: "к", // кирпич преобладает
    totalFloors: 5,
    condition: "рем"
  },
  "20 мкр": {
    wallMaterial: "п", // панель преобладает
    totalFloors: 5,
    layout: "ул"
  },
  "Рабочий": {
    wallMaterial: "к", // кирпич
    totalFloors: 5,
    condition: "рем"
  },
  "Вокзал": {
    wallMaterial: "к", // кирпич
    totalFloors: 5,
    condition: "рем"
  },
  "ДСР": {
    wallMaterial: "к", // кирпич
    totalFloors: 9,
    condition: "рем"
  }
}

/**
 * Получить справочные данные для автозаполнения на основе года постройки
 */
export function getReferenceDataByYear(year: number): ReferenceData | null {
  const range = YEAR_BUILT_REFERENCE.find(
    range => year >= range.minYear && year <= range.maxYear
  )
  
  return range ? range.data : null
}

/**
 * Получить описание периода постройки
 */
export function getYearPeriodDescription(year: number): string {
  const range = YEAR_BUILT_REFERENCE.find(
    range => year >= range.minYear && year <= range.maxYear
  )
  
  return range ? range.description : "Год постройки не найден в справочнике"
}

/**
 * Получить дополнительные данные по району
 */
export function getDistrictPatterns(districtName: string): Partial<ReferenceData> {
  return DISTRICT_PATTERNS[districtName] || {}
}

/**
 * Объединить справочные данные с учетом приоритетов
 * 1. Данные по году постройки (основные)
 * 2. Данные по району (дополнительные/корректирующие)
 */
export function getCombinedReferenceData(
  year: number, 
  districtName?: string
): ReferenceData | null {
  const yearData = getReferenceDataByYear(year)
  if (!yearData) return null
  
  const districtData = districtName ? getDistrictPatterns(districtName) : {}
  
  // Объединяем данные с приоритетом района для специфических полей
  return {
    ...yearData,
    ...districtData
  }
}