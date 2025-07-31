export function normalizeSchoolName(name: string): string {
  let normalized = name.toUpperCase().trim();
  
  // Rule for SMK/SMA/MA Negeri
  normalized = normalized.replace(/SMK NEGERI |SMK N /g, 'SMKN ');
  normalized = normalized.replace(/SMA NEGERI |SMA N  /g, 'SMAN ');
  normalized = normalized.replace(/MA NEGERI | MA N  /g, 'MAN ');

  // Rule for SMP Negeri
  normalized = normalized.replace(/SMP NEGERI |SMP N /g, 'SMPN ');

  // Rule for MTS Negeri
  normalized = normalized.replace(/MTS NEGERI |MTSN /g, 'MTSN ');
  
  // Rule for IT schools
  normalized = normalized.replace(/ SMP ISLAM TERPADU|SMP IT /g, 'SMPIT ');

  // Remove multiple spaces
  return normalized.replace(/\s+/g, ' ');
}