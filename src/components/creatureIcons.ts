/**
 * Иконки существ: id → адрес картинки.
 *
 * Файлы лежат по фракциям: units/<фракция>/<Английское_имя>.webp — пробелы
 * заменены на «_», апострофы выброшены: «Sun's Aegis» → Suns_Aegis.webp.
 * Имя файла строчными и без знаков — это ровно id существа, то же правило,
 * что проверяет creatures.test.ts. Поэтому таблица соответствий не нужна:
 * положил файл по правилу — иконка подхватилась. Что у каждого существа
 * иконка есть, проверяет creatureIcons.test.ts.
 *
 * ?no-inline — чтобы Vite не вшивал иконки в JS. Без него 103 файла из 148
 * (те, что меньше 4 КБ) уехали бы в бандл строками base64, и сжатый JS вырос
 * бы в пять раз — для всех, даже для тех, кто сравнение армий не открывает.
 * Отдельный файл грузится, только когда иконку показывают, а хеш в его
 * имени меняется только вместе с картинкой — и кеш браузера переживает
 * любые правки кода.
 */
const files = import.meta.glob<string>('../assets/images/units/*/*.webp', {
  eager: true,
  query: '?no-inline',
  import: 'default',
})

/** Путь к файлу → id существа: «…/temple/Suns_Aegis.webp» → «sunsaegis». */
const idOf = (path: string) =>
  path
    .slice(path.lastIndexOf('/') + 1, -'.webp'.length)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const ICONS = new Map(Object.entries(files).map(([path, url]) => [idOf(path), url]))

/** Адрес иконки существа или undefined, если иконки нет. */
export const creatureIcon = (id: string): string | undefined => ICONS.get(id)
