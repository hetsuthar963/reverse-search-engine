// import { stripMarkdownArtifacts } from './text.js';

// const STOP_WORDS = new Set([
//   'this', 'that', 'with', 'from', 'have', 'will', 'been', 'they', 'their', 'your',
//   'about', 'said', 'there', 'which', 'would', 'could', 'should', 'after', 'before',
//   'where', 'when', 'what', 'into', 'over', 'under', 'above', 'below', 'image', 'document',
//   'jpeg', 'jpg', 'png', 'img'
// ]);

// const topTerms = (text, limit = 5) => {
//   if (!text) return [];
//   const tokens = stripMarkdownArtifacts(text)
//     .replace(/[^a-zA-Z0-9\s]/g, ' ')
//     .split(/\s+/)
//     .map((token) => token.trim().toLowerCase())
//     .filter((token) => token.length > 3 && !STOP_WORDS.has(token));

//   const counts = tokens.reduce((acc, token) => {
//     acc[token] = (acc[token] || 0) + 1;
//     return acc;
//   }, {});

//   return Object.entries(counts)
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, limit)
//     .map(([term]) => term);
// };

// const extractIdNumbers = (text) => {
//   if (!text) return [];
//   const clean = stripMarkdownArtifacts(text);
//   const matches = clean.match(/(?:\d[\s-]?){6,}/g) || [];
//   const normalized = matches
//     .map((candidate) => candidate.replace(/\D/g, ''))
//     .filter((digits) => digits.length >= 6 && digits.length <= 18);
//   return Array.from(new Set(normalized));
// };

// const extractNames = (text) => {
//   if (!text) return [];
//   const clean = stripMarkdownArtifacts(text).replace(/[0-9]/g, '');
//   const matches = clean.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3}\b/g) || [];
//   return Array.from(new Set(matches));
// };

// const extractYears = (text) => {
//   if (!text) return [];
//   const clean = stripMarkdownArtifacts(text);
//   const matches = clean.match(/\b(19|20)\d{2}\b/g) || [];
//   return Array.from(new Set(matches));
// };

// const extractGender = (text) => {
//   if (!text) return [];
//   const clean = stripMarkdownArtifacts(text).toLowerCase();
//   const genders = [];
//   if (/\bmale\b/.test(clean) || /पुरुष/.test(clean)) genders.push('Male');
//   if (/\bfemale\b/.test(clean) || /महिला/.test(clean)) genders.push('Female');
//   return Array.from(new Set(genders));
// };

// const detectDocumentType = (text = '') => {
//   const corpus = stripMarkdownArtifacts(text).toLowerCase();
//   if (/passport/.test(corpus)) return 'passport';
//   if (/aadhaar/.test(corpus) || /aadhar/.test(corpus)) return 'Aadhaar card';
//   if (/license/.test(corpus)) return 'license';
//   if (/certificate/.test(corpus)) return 'certificate';
//   if (/id card/.test(corpus) || /identity card/.test(corpus)) return 'identity card';
//   if (/pan\s?card/.test(corpus)) return 'PAN card';
//   return 'document';
// };

// export const extractEntities = ({ ocrText = '', visionDescription = '' } = {}) => {
//   const corpus = [ocrText, visionDescription].filter(Boolean).join('\n');
//   const ids = extractIdNumbers(corpus);
//   const names = extractNames(corpus);
//   const years = extractYears(corpus);
//   const genders = extractGender(corpus);
//   const baseTerms = topTerms(corpus, 5);
//   const documentType = detectDocumentType(corpus);

//   return {
//     ids,
//     names,
//     years,
//     genders,
//     baseTerms,
//     documentType,
//     id: ids[0] || null,
//     name: names[0] || null,
//     year: years[0] || null,
//     gender: genders[0] || null
//   };
// };

// const dedupe = (values = []) => Array.from(new Set(values.filter(Boolean)));

// /**
//  * Build a search plan for reverse image and text-based verification
//  * @param {Object} params
//  * @param {string} params.imageUrl - URL of the input image
//  * @param {Object} params.ocr - OCR result containing textPreview
//  * @param {Object} params.vision - Vision result containing description
//  * @param {Object} params.entities - Extracted entities (ids, names, years, etc.)
//  * @param {string} params.documentType - Detected document type (e.g., “Passport”)
//  * @returns {Object} Search plan with primaryQuery, textQueries, and context
//  */
// export function buildSearchPlan({ imageUrl, ocr = {}, vision = {}, entities = {}, documentType }) {
//   const docType = (documentType || entities.documentType || '').trim() || 'document';

//   const primaryQuery = entities.ids?.length
//     ? `"${entities.ids[0]}" "${docType}"`
//     : entities.names?.length
//       ? `"${entities.names[0]}" "${docType}"`
//       : `"${docType}"`;

//   const addQuery = (set, value) => {
//     if (value) set.add(value);
//   };

//   const queries = new Set();

//   entities.ids?.slice(0, 3).forEach((id) => {
//     addQuery(queries, `"${id}"`);
//     addQuery(queries, `"${id}" "${docType}"`);
//     addQuery(queries, `"${id}" ${docType} verification`);
//     addQuery(queries, `"${id}" "${docType}" site:uidai.gov.in`);
//     addQuery(queries, `"${id}" data leak`);
//     addQuery(queries, `"${id}" fraud`);
//     const spaced = id.length > 4 ? id.match(/.{1,4}/g)?.join(' ') : null;
//     if (spaced && spaced !== id) {
//       addQuery(queries, `"${spaced}"`);
//     }
//   });

//   entities.names?.slice(0, 3).forEach((name) => {
//     addQuery(queries, `"${name}"`);
//     addQuery(queries, `"${name}" "${docType}"`);
//     addQuery(queries, `"${name}" ${docType} fraud`);
//     if (entities.years?.[0]) {
//       addQuery(queries, `"${name}" ${entities.years[0]}`);
//     }
//   });

//   if (entities.ids?.length && entities.names?.length) {
//     addQuery(queries, `"${entities.names[0]}" "${entities.ids[0]}"`);
//   }

//   addQuery(queries, `${docType} template`);
//   addQuery(queries, `${docType} generator`);
//   addQuery(queries, `${docType} fraud`);

//   entities.baseTerms?.slice(0, 3).forEach((term) => {
//     addQuery(queries, `${term} ${docType}`);
//   });

//   return {
//     imageUrl,
//     ocrText: ocr.textPreview ?? ocr.text ?? '',
//     visionDescription: vision.description ?? '',
//     documentType: docType,
//     entities,
//     primaryQuery,
//     textQueries: dedupe(Array.from(queries))
//   };
// }



import { stripMarkdownArtifacts } from './text.js';

const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'will', 'been', 'they', 'their', 'your',
  'about', 'said', 'there', 'which', 'would', 'could', 'should', 'after', 'before',
  'where', 'when', 'what', 'into', 'over', 'under', 'above', 'below', 'image', 'document',
  'jpeg', 'jpg', 'png', 'img'
]);

const topTerms = (text, limit = 5) => {
  if (!text) return [];
  const tokens = stripMarkdownArtifacts(text)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));

  const counts = tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
};

const extractIdNumbers = (text) => {
  if (!text) return [];
  const clean = stripMarkdownArtifacts(text);
  const matches = clean.match(/(?:\d[\s-]?){6,}/g) || [];
  const normalized = matches
    .map((candidate) => candidate.replace(/\D/g, ''))
    .filter((digits) => digits.length >= 6 && digits.length <= 18);
  return Array.from(new Set(normalized));
};

const extractNames = (text) => {
  if (!text) return [];
  const clean = stripMarkdownArtifacts(text).replace(/[0-9]/g, '');
  const matches = clean.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3}\b/g) || [];
  return Array.from(new Set(matches));
};

const extractYears = (text) => {
  if (!text) return [];
  const clean = stripMarkdownArtifacts(text);
  const matches = clean.match(/\b(19|20)\d{2}\b/g) || [];
  return Array.from(new Set(matches));
};

const extractGender = (text) => {
  if (!text) return [];
  const clean = stripMarkdownArtifacts(text).toLowerCase();
  const genders = [];
  if (/\bmale\b/.test(clean) || /पुरुष/.test(clean)) genders.push('Male');
  if (/\bfemale\b/.test(clean) || /महिला/.test(clean)) genders.push('Female');
  return Array.from(new Set(genders));
};

const detectDocumentType = (text = '') => {
  const corpus = stripMarkdownArtifacts(text).toLowerCase();
  if (/passport/.test(corpus)) return 'passport';
  if (/aadhaar/.test(corpus) || /aadhar/.test(corpus)) return 'Aadhaar card';
  if (/license/.test(corpus)) return 'license';
  if (/certificate/.test(corpus)) return 'certificate';
  if (/id card/.test(corpus) || /identity card/.test(corpus)) return 'identity card';
  if (/pan\s?card/.test(corpus)) return 'PAN card';
  return 'document';
};

export const extractEntities = ({ ocrText = '', visionDescription = '' } = {}) => {
  const corpus = [ocrText, visionDescription].filter(Boolean).join('\n');
  const ids = extractIdNumbers(corpus);
  const names = extractNames(corpus);
  const years = extractYears(corpus);
  const genders = extractGender(corpus);
  const baseTerms = topTerms(corpus, 5);
  const documentType = detectDocumentType(corpus);

  return {
    ids,
    names,
    years,
    genders,
    baseTerms,
    documentType,
    id: ids[0] || null,
    name: names[0] || null,
    year: years[0] || null,
    gender: genders[0] || null
  };
};

const dedupe = (values = []) => Array.from(new Set(values.filter(Boolean)));

/**
 * Build a search plan for reverse image and text-based verification
 * @param {Object} params
 * @param {string} params.imageUrl - URL of the input image
 * @param {Object} params.ocr - OCR result containing textPreview
 * @param {Object} params.vision - Vision result containing description
 * @param {Object} params.entities - Extracted entities (ids, names, years, etc.)
 * @param {string} params.documentType - Detected document type (e.g., “Passport”)
 * @returns {Object} Search plan with primaryQuery, textQueries, and context
 */
export function buildSearchPlan({ imageUrl, ocr = {}, vision = {}, entities = {}, documentType }) {
  const docType = (documentType || entities.documentType || '').trim() || 'document';

  const primaryQuery = entities.ids?.length
    ? `"${entities.ids[0]}" "${docType}"`
    : entities.names?.length
      ? `"${entities.names[0]}" "${docType}"`
      : `"${docType}"`;

  const addQuery = (set, value) => {
    if (value) set.add(value);
  };

  const queries = new Set();

  entities.ids?.slice(0, 3).forEach((id) => {
    addQuery(queries, `"${id}"`);
    addQuery(queries, `"${id}" "${docType}"`);
    addQuery(queries, `"${id}" ${docType} verification`);
    addQuery(queries, `"${id}" "${docType}" site:uidai.gov.in`);
    addQuery(queries, `"${id}" data leak`);
    addQuery(queries, `"${id}" fraud`);
    const spaced = id.length > 4 ? id.match(/.{1,4}/g)?.join(' ') : null;
    if (spaced && spaced !== id) {
      addQuery(queries, `"${spaced}"`);
    }
  });

  entities.names?.slice(0, 3).forEach((name) => {
    addQuery(queries, `"${name}"`);
    addQuery(queries, `"${name}" "${docType}"`);
    addQuery(queries, `"${name}" ${docType} fraud`);
    if (entities.years?.[0]) {
      addQuery(queries, `"${name}" ${entities.years[0]}`);
    }
  });

  if (entities.ids?.length && entities.names?.length) {
    addQuery(queries, `"${entities.names[0]}" "${entities.ids[0]}"`);
  }

  addQuery(queries, `${docType} template`);
  addQuery(queries, `${docType} generator`);
  addQuery(queries, `${docType} fraud`);

  entities.baseTerms?.slice(0, 3).forEach((term) => {
    addQuery(queries, `${term} ${docType}`);
  });

  return {
    imageUrl,
    ocrText: ocr.textPreview ?? ocr.text ?? '',
    visionDescription: vision.description ?? '',
    documentType: docType,
    entities,
    primaryQuery,
    textQueries: dedupe(Array.from(queries))
  };
}
