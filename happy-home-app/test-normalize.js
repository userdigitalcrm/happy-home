// Тестирование функции нормализации из API
function normalizeStreet(raw) {
  return raw
    // убираем распространённые сокращения типов улиц (дополнено)
    .replace(/^(ул\.|улица|ул)\s+/i, "")
    .replace(/^(пр-т\.|проспект|пр\.|пр)\s+/i, "")
    .replace(/^(бул\.|бульвар)\s+/i, "")
    .replace(/^(пл\.|площадь)\s+/i, "")
    .replace(/^(пер\.|переулок)\s+/i, "")
    .replace(/^(пр-д\.|проезд|прд)\s+/i, "")
    .replace(/^(шоссе|ш\.|ш)\s+/i, "")
    .replace(/[.,]/g, " ")                     // точки/запятые → пробел
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Тестирование функции разбора адреса
function parseAddress(address) {
  const trimmed = address.trim();
  if (!trimmed) return {};

  // Приводим строку к единому регистру и убираем запятые типа «д.», «к.» и т.п.
  const normalized = trimmed
    .replace(/д\.?/gi, "")
    .replace(/к\.?/gi, "")
    .replace(/корп\.?/gi, "")
    .replace(/стр\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Паттерны для распознавания адресов
  const patterns = [
    // «Улица, номер буква» с пробелом между цифрой и литерой
    /^(.+?)[,\s]+(\d+\s*[\wА-Яа-я-\/]*)$/i,
    // «Улица, номер» или «Улица номер» (допускаем дефис/корпус/литера, без пробела)
    /^(.+?)[,\s]+(\d+\s*[\w-/]*)$/i,
    // «номер Улица» или «10 ул. Ленина» (поддержка пробела между цифрой и буквой)
    /^(\d+\s*[\wА-Яа-я-/]*)\s+(.+)$/i,
    // «Улица, д. 10»
    /^(.+?),?\s*д\.?\s*(\d+\s*[\wА-Яа-я-/]*)$/i,
    // «Улица, дом 10 корпус 1»
    /^(.+?),?\s*дом\s*(\d+\s*[\wА-Яа-я-/]*)$/i,
    // «Улица дом 10» без запятой
    /^(.+?)\s+дом\s+(\d+\s*[\wА-Яа-я-/]*)$/i,
    // Фоллбек: «Улица, 10к1» (корпус, допускаем пробел)
    /^(.+?),?\s*(\d+\s*[\wА-Яа-я-/]*)$/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const [, part1, part2] = match;
      // Если первая часть начинается с цифры — это номер дома
      if (/^\d/.test(part1)) {
        return {
          street: normalizeStreet(part2),
          houseNumber: part1.toLowerCase()
        };
      }
      return {
        street: normalizeStreet(part1),
        houseNumber: part2.toLowerCase()
      };
    }
  }

  // Если не удалось разобрать, считаем все названием улицы
  return {
    street: normalizeStreet(normalized)
  };
}

console.log('Тестирование нормализации улицы:');
console.log('normalizeStreet("ул. Абая"):', normalizeStreet("ул. Абая"));
console.log('normalizeStreet("улица Абая"):', normalizeStreet("улица Абая"));
console.log('normalizeStreet("Абая"):', normalizeStreet("Абая"));

console.log('\nТестирование разбора адреса:');
console.log('parseAddress("Абая"):', parseAddress("Абая"));
console.log('parseAddress("ул. Абая"):', parseAddress("ул. Абая"));
console.log('parseAddress("улица Абая"):', parseAddress("улица Абая"));
console.log('parseAddress("Абая, 57"):', parseAddress("Абая, 57"));
console.log('parseAddress("ул. Абая, 57"):', parseAddress("ул. Абая, 57"));