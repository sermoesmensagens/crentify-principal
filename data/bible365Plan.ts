// Auto-generated: Bíblia em 365 Dias — 1189 capítulos distribuídos em 365 dias
// 104 dias com 4 capítulos + 261 dias com 3 capítulos = 1189 total

import { ReadingPlanContent } from '../types';

const BIBLE_BOOKS: { name: string; chapters: number }[] = [
  { name: 'Gênesis', chapters: 50 },
  { name: 'Êxodo', chapters: 40 },
  { name: 'Levítico', chapters: 27 },
  { name: 'Números', chapters: 36 },
  { name: 'Deuteronômio', chapters: 34 },
  { name: 'Josué', chapters: 24 },
  { name: 'Juízes', chapters: 21 },
  { name: 'Rute', chapters: 4 },
  { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 },
  { name: '1 Reis', chapters: 22 },
  { name: '2 Reis', chapters: 25 },
  { name: '1 Crônicas', chapters: 29 },
  { name: '2 Crônicas', chapters: 36 },
  { name: 'Esdras', chapters: 10 },
  { name: 'Neemias', chapters: 13 },
  { name: 'Ester', chapters: 10 },
  { name: 'Jó', chapters: 42 },
  { name: 'Salmos', chapters: 150 },
  { name: 'Provérbios', chapters: 31 },
  { name: 'Eclesiastes', chapters: 12 },
  { name: 'Cânticos', chapters: 8 },
  { name: 'Isaías', chapters: 66 },
  { name: 'Jeremias', chapters: 52 },
  { name: 'Lamentações', chapters: 5 },
  { name: 'Ezequiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Oséias', chapters: 14 },
  { name: 'Joel', chapters: 3 },
  { name: 'Amós', chapters: 9 },
  { name: 'Obadias', chapters: 1 },
  { name: 'Jonas', chapters: 4 },
  { name: 'Miquéias', chapters: 7 },
  { name: 'Naum', chapters: 3 },
  { name: 'Habacuque', chapters: 3 },
  { name: 'Sofonias', chapters: 3 },
  { name: 'Ageu', chapters: 2 },
  { name: 'Zacarias', chapters: 14 },
  { name: 'Malaquias', chapters: 4 },
  { name: 'Mateus', chapters: 28 },
  { name: 'Marcos', chapters: 16 },
  { name: 'Lucas', chapters: 24 },
  { name: 'João', chapters: 21 },
  { name: 'Atos', chapters: 28 },
  { name: 'Romanos', chapters: 16 },
  { name: '1 Coríntios', chapters: 16 },
  { name: '2 Coríntios', chapters: 13 },
  { name: 'Gálatas', chapters: 6 },
  { name: 'Efésios', chapters: 6 },
  { name: 'Filipenses', chapters: 4 },
  { name: 'Colossenses', chapters: 4 },
  { name: '1 Tessalonicenses', chapters: 5 },
  { name: '2 Tessalonicenses', chapters: 3 },
  { name: '1 Timóteo', chapters: 6 },
  { name: '2 Timóteo', chapters: 4 },
  { name: 'Tito', chapters: 3 },
  { name: 'Filemon', chapters: 1 },
  { name: 'Hebreus', chapters: 13 },
  { name: 'Tiago', chapters: 5 },
  { name: '1 Pedro', chapters: 5 },
  { name: '2 Pedro', chapters: 3 },
  { name: '1 João', chapters: 5 },
  { name: '2 João', chapters: 1 },
  { name: '3 João', chapters: 1 },
  { name: 'Judas', chapters: 1 },
  { name: 'Apocalipse', chapters: 22 },
];

function generateBible365Content(): ReadingPlanContent[] {
  const PLAN_ID = 'plan-bible-year';
  const TOTAL_DAYS = 365;

  // Build flat list of all 1189 chapters
  const allChapters: { book: string; chapter: number }[] = [];
  for (const book of BIBLE_BOOKS) {
    for (let c = 1; c <= book.chapters; c++) {
      allChapters.push({ book: book.name, chapter: c });
    }
  }

  const totalChapters = allChapters.length; // 1189
  const base = Math.floor(totalChapters / TOTAL_DAYS); // 3
  const extras = totalChapters % TOTAL_DAYS; // 104

  const result: ReadingPlanContent[] = [];
  let chapIdx = 0;

  for (let d = 0; d < TOTAL_DAYS; d++) {
    const dayNum = d + 1;
    const capsToday = d < extras ? base + 1 : base;
    const week = Math.ceil(dayNum / 7);
    const weekName = `Semana ${week}`;

    const caps = allChapters.slice(chapIdx, chapIdx + capsToday);
    chapIdx += capsToday;

    const resources = caps.map((c, idx) => ({
      id: `res-bible365-d${dayNum}-${idx}`,
      type: 'leitura' as const,
      title: `${c.book} ${c.chapter}`,
      duration: '1 cap',
      instruction: `Leia ${c.book} capítulo ${c.chapter} devagar, meditando em cada versículo.`,
    }));

    // Build readable day title
    const first = caps[0];
    const last = caps[caps.length - 1];
    const dayTitle =
      caps.length === 1
        ? `${first.book} ${first.chapter}`
        : first.book === last.book
        ? `${first.book} ${first.chapter}–${last.chapter}`
        : `${first.book} ${first.chapter} · ${last.book} ${last.chapter}`;

    result.push({
      id: `day-bible365-${dayNum}`,
      planId: PLAN_ID,
      week: weekName,
      day: `Dia ${dayNum}`,
      title: dayTitle,
      resources,
    });
  }

  return result;
}

export const BIBLE_365_CONTENT: ReadingPlanContent[] = generateBible365Content();
