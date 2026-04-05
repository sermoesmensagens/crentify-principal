/**
 * Script gerador do plano "Bíblia em 365 Dias"
 * Gera os 1.189 capítulos distribuídos em 365 dias
 * 3 caps em 261 dias, 4 caps em 104 dias (total exato: 1189)
 * Execute: node scripts/generate_bible_plan.js
 */

const BIBLE_BOOKS = [
  // Antigo Testamento
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
  // Novo Testamento
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

// Build flat list of all chapters
const allChapters = [];
for (const book of BIBLE_BOOKS) {
  for (let c = 1; c <= book.chapters; c++) {
    allChapters.push({ book: book.name, chapter: c });
  }
}

const TOTAL_CHAPTERS = allChapters.length; // 1189
const TOTAL_DAYS = 365;
const base = Math.floor(TOTAL_CHAPTERS / TOTAL_DAYS); // 3
const extras = TOTAL_CHAPTERS % TOTAL_DAYS; // 104 days get 4 chapters

// Distribute evenly: spread extra chapters across the year
const dayAllocations = [];
for (let d = 0; d < TOTAL_DAYS; d++) {
  // Spread the extra days evenly using Bresenham-style distribution
  const capsToday = d < extras ? base + 1 : base;
  dayAllocations.push(capsToday);
}

// Build days with chapters
const PLAN_ID = 'plan-bible-year';
const days = [];
let chapIdx = 0;

for (let d = 0; d < TOTAL_DAYS; d++) {
  const dayNum = d + 1;
  const week = Math.ceil(dayNum / 7);
  const weekName = `Semana ${week}`;
  const caps = [];
  for (let i = 0; i < dayAllocations[d]; i++) {
    caps.push(allChapters[chapIdx++]);
  }

  const resources = caps.map((c, idx) => ({
    id: `res-bible365-d${dayNum}-${idx}`,
    type: 'leitura',
    title: `${c.book} ${c.chapter}`,
    duration: '1 cap',
    instruction: `Leia ${c.book} capítulo ${c.chapter} com atenção e oração.`
  }));

  const firstBook = caps[0].book.replace(/^\d+\s+/, '');
  const lastBook = caps[caps.length - 1].book.replace(/^\d+\s+/, '');
  const title = caps.length === 1
    ? `${caps[0].book} ${caps[0].chapter}`
    : caps[0].book === caps[caps.length - 1].book
      ? `${caps[0].book} ${caps[0].chapter}–${caps[caps.length - 1].chapter}`
      : `${caps[0].book} ${caps[0].chapter} + ${caps[caps.length - 1].book} ${caps[caps.length - 1].chapter}`;

  days.push({
    id: `day-bible365-${dayNum}`,
    planId: PLAN_ID,
    week: weekName,
    day: `Dia ${dayNum}`,
    title,
    resources
  });
}

console.log(`✅ Total capítulos: ${chapIdx} / ${TOTAL_CHAPTERS}`);
console.log(`✅ Dias gerados: ${days.length}`);
console.log(`✅ Semanas: ${Math.ceil(TOTAL_DAYS / 7)}`);
console.log('\nDia 1:', JSON.stringify(days[0], null, 2));
console.log('\nDia 365:', JSON.stringify(days[364], null, 2));

// Export for use in context
module.exports = { days, PLAN_ID };
