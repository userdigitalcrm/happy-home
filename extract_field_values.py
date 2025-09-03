import csv
from collections import defaultdict
import json

# Read the CSV file and extract structured data
file_path = r"c:\Users\donpa\Desktop\happy_home\База недвижимости Петропавловск.xlsx - База_База недвижимости.csv"

print("Извлечение структурированных значений полей...")

# Field mappings based on analysis
field_mappings = {
    'КАТ': 'category',           # Category (1 ком, 2 ком, etc.)
    'Статус': 'status',         # Status 
    'Район': 'district',        # District
    'Цена': 'price',            # Price
    'План': 'layout',           # Layout/Plan
    'Эт': 'floor',              # Floor
    'Эть': 'totalFloors',       # Total floors
    'М': 'rooms',               # Rooms (sometimes used for rooms)
    'S': 'totalArea',           # Total area
    'S кх': 'kitchenArea',      # Kitchen area
    'Блкн': 'balcony',          # Balcony
    'П': 'condition',           # Condition (sometimes)
    'Состояние': 'state',       # State/Condition
    'Телефон': 'phone',         # Phone
    'Улица': 'street',          # Street
    'Д-кв': 'houseApartment',   # House-apartment
    'Год': 'year',              # Year built
    'Изм': 'modified',          # Modified date
    'Создано': 'created',       # Created date
    'Фото': 'photos',           # Photos
    'Источник': 'source',       # Source
    'Описание': 'description'   # Description
}

structured_data = {}

try:
    with open(file_path, 'r', encoding='utf-8') as file:
        # Detect delimiter
        sample = file.read(1024)
        file.seek(0)
        delimiter = ',' if sample.count(',') > sample.count(';') else ';'
        
        reader = csv.reader(file, delimiter=delimiter)
        headers = next(reader)
        
        print(f"Обработанные столбцы: {headers}")
        
        # Initialize structure for each field
        for header in headers:
            structured_data[header] = {
                'unique_values': set(),
                'sample_values': [],
                'data_type': 'text',
                'total_count': 0,
                'non_empty_count': 0
            }
        
        # Process all rows
        for row_num, row in enumerate(reader, 1):
            for i, value in enumerate(row):
                if i < len(headers):
                    header = headers[i]
                    structured_data[header]['total_count'] += 1
                    
                    if value.strip():
                        cleaned_value = value.strip()
                        structured_data[header]['unique_values'].add(cleaned_value)
                        structured_data[header]['non_empty_count'] += 1
                        
                        # Keep first 10 sample values
                        if len(structured_data[header]['sample_values']) < 10:
                            structured_data[header]['sample_values'].append(cleaned_value)
        
        # Convert sets to lists and determine data types
        for header in structured_data:
            data = structured_data[header]
            data['unique_values'] = sorted(list(data['unique_values']), key=str)
            
            # Try to determine data type
            if header in ['Цена', 'S', 'S кх', 'Эт', 'Эть', 'М']:
                data['data_type'] = 'number'
            elif header in ['Год']:
                data['data_type'] = 'year'
            elif header in ['Изм', 'Создано']:
                data['data_type'] = 'date'
            elif header in ['Телефон']:
                data['data_type'] = 'phone'
            elif header in ['Фото']:
                data['data_type'] = 'url'
            else:
                data['data_type'] = 'text'
        
        # Output structured analysis
        print("\n" + "="*80)
        print("СТРУКТУРИРОВАННЫЙ АНАЛИЗ ПОЛЕЙ")
        print("="*80)
        
        for header, data in structured_data.items():
            print(f"\nПОЛЕ: {header}")
            print(f"Тип данных: {data['data_type']}")
            print(f"Всего записей: {data['total_count']}")
            print(f"Заполненных: {data['non_empty_count']}")
            print(f"Уникальных значений: {len(data['unique_values'])}")
            
            if len(data['unique_values']) <= 30:
                print("Все уникальные значения:")
                for val in data['unique_values'][:30]:
                    print(f"  - {val}")
            else:
                print("Первые 20 уникальных значений:")
                for val in data['unique_values'][:20]:
                    print(f"  - {val}")
                print(f"  ... и еще {len(data['unique_values']) - 20}")
            print("-" * 50)
        
        # Save to JSON for further processing
        serializable_data = {}
        for header, data in structured_data.items():
            serializable_data[header] = {
                'unique_values': data['unique_values'],
                'sample_values': data['sample_values'],
                'data_type': data['data_type'],
                'total_count': data['total_count'],
                'non_empty_count': data['non_empty_count']
            }
        
        with open('field_analysis.json', 'w', encoding='utf-8') as json_file:
            json.dump(serializable_data, json_file, ensure_ascii=False, indent=2)
        
        print(f"\nДанные сохранены в field_analysis.json")

except Exception as e:
    print(f"Ошибка: {e}")