/**
 * Membersihkan format markdown mentah (bold, italic, list, headings, code, sitasi rujukan)
 * menjadi teks biasa (plain text) yang bersih untuk preview riwayat atau judul obrolan.
 */
export function stripMarkdown(text?: string | null): string {
  if (!text) return '';

  return text
    // 1. Hapus sitasi rujukan internal [Rujukan 1], [S1], dll
    .replace(/\[(?:Rujukan|S)\s*\d+[^\]]*\]/gi, '')
    // 2. Hapus tautan markdown: [teks](url) -> teks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 3. Hapus bold / italic: **teks**, *teks*, __teks__, _teks_
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // 4. Hapus inline code: `kode` -> kode
    .replace(/`([^`]+)`/g, '$1')
    // 5. Hapus heading markdown (#, ##, ###)
    .replace(/^#{1,6}\s+/gm, '')
    // 6. Hapus blockquote (>)
    .replace(/^>\s+/gm, '')
    // 7. Hapus penanda bullet list atau numbered list di awal baris (- , * , 1. )
    .replace(/^[\s*+-]+\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // 8. Bersihkan sisa tanda bintang tunggal atau ganda yang tertinggal
    .replace(/\*+/g, '')
    // 9. Satukan spasi berlebih dan enter menjadi satu baris mengalir
    .replace(/\s+/g, ' ')
    .trim();
}

