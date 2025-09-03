import csv
from collections import defaultdict

# Read the CSV file
file_path = r"c:\Users\donpa\Desktop\happy_home\База недвижимости Петропавловск.xlsx - База_База недвижимости.csv"

print("Анализ базы данных недвижимости...")
print("="*80)

try:
    with open(file_path, 'r', encoding='utf-8') as file:
        # Try to detect delimiter
        sample = file.read(1024)
        file.seek(0)
        
        # Check common delimiters
        delimiter = ','
        if sample.count(';') > sample.count(','):
            delimiter = ';'
        elif sample.count('\t') > sample.count(','):
            delimiter = '\t'
        
        reader = csv.reader(file, delimiter=delimiter)
        
        # Read header
        headers = next(reader)
        print(f"Найденные столбцы ({len(headers)}):")
        for i, header in enumerate(headers):
            print(f"  {i+1}. {header}")
        
        print(f"\nИспользуемый разделитель: '{delimiter}'")
        print("\n" + "="*80 + "\n")
        
        # Collect unique values for each column
        unique_values = defaultdict(set)
        row_count = 0
        
        for row in reader:
            row_count += 1
            for i, value in enumerate(row):
                if i < len(headers) and value.strip():  # Only non-empty values
                    unique_values[headers[i]].add(value.strip())
        
        print(f"Общее количество записей: {row_count}")
        print("\n" + "="*80 + "\n")
        
        # Display unique values for each column
        for header in headers:
            values = unique_values[header]
            print(f"СТОЛБЕЦ: {header}")
            print("-" * 50)
            print(f"Количество уникальных значений: {len(values)}")
            
            if len(values) <= 50:  # Show all if not too many
                sorted_values = sorted(values, key=str)
                for val in sorted_values:
                    print(f"  - {val}")
            else:
                # Show first 20 values
                sorted_values = sorted(values, key=str)
                print("Первые 20 значений:")
                for val in sorted_values[:20]:
                    print(f"  - {val}")
                print(f"  ... и еще {len(values) - 20} значений")
            
            print("\n" + "="*50 + "\n")

except Exception as e:
    print(f"Ошибка при чтении файла: {e}")
    
    # Try different encodings
    encodings = ['utf-8', 'windows-1251', 'cp1251', 'iso-8859-1']
    for encoding in encodings:
        try:
            print(f"\nПробую кодировку: {encoding}")
            with open(file_path, 'r', encoding=encoding) as file:
                sample = file.read(200)
                print(f"Образец: {sample[:100]}...")
                break
        except Exception as enc_error:
            print(f"Кодировка {encoding} не подошла: {enc_error}")