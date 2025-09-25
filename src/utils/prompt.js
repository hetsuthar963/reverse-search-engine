// /**
//  * Generate the LLM prompt for document forgery verification (example: Aadhaar or other)
//  * @param {Object} data - Input data from pipeline report
//  * @returns {string} Structured prompt for LLM consumption
//  */
// export function generateForgeryVerificationPrompt(data) {
//   // Defensive destructuring with fallback
//   const {
//     ocr = {},
//     vision = {},
//     matches = {},
//     input = {},
//     searchPlan = {},
//   } = data || {};

//   // Gather and sanitize main fields
//   const ocrText = (ocr.textPreview || "").trim() || "No OCR text extracted.";
//   const visionDesc = (vision.description || "").trim() || "Vision analysis unavailable (timeout).";

//   // Image hits (reverse image search)
//   const imageHits = Array.isArray(matches.imageHits) && matches.imageHits.length > 0
//     ? matches.imageHits.map(hit =>
//         `- ${hit.title || 'No Title'} (${hit.domain || 'unknown'}): ${hit.snippet || 'No snippet'}`
//       ).join('\n')
//     : "No similar images found online.";

//   // Text hits (web search)
//   const textHits = Array.isArray(matches.textHits) && matches.textHits.length > 0
//     ? matches.textHits.map(hit =>
//         `- ${hit.title || 'No Title'} (${hit.domain || 'unknown'}): ${hit.snippet || 'No snippet'}`
//       ).join('\n')
//     : "No relevant text results found.";

//   // Entity lists
//   const entities = searchPlan.entities || {};
//   const ids = Array.isArray(entities.ids) && entities.ids.length ? entities.ids.join(", ") : "None detected";
//   const names = Array.isArray(entities.names) && entities.names.length ? entities.names.join(", ") : "None detected";
//   const years = Array.isArray(entities.years) && entities.years.length ? entities.years.join(", ") : "None detected";

//   // Compose prompt
//   return `
// You are a document authenticity and forgery detection expert. Your task is to analyze the following signals and determine if the submitted document is likely authentic, forged, or a template.

// # DOCUMENT TYPE
// Aadhaar card (India's national biometric ID)

// # INPUT IMAGE
// URL: ${input.imageUrl || "Unknown"}

// # EXTRACTED INFORMATION
// - ID Number(s): ${ids}
// - Name(s): ${names}
// - Year(s) of Birth: ${years}
// - OCR Text: ${ocrText}

// # VISUAL ANALYSIS
// ${visionDesc}

// # REVERSE IMAGE SEARCH RESULTS
// ${imageHits}

// # TEXT-BASED WEB SEARCH RESULTS
// ${textHits}

// # INSTRUCTIONS
// Answer the following in **JSON format only**:
// {
//   "authenticity": "authentic|likely-forged|highly-suspicious|template|uncertain",
//   "confidence": 0-100,
//   "rationale": "2-3 sentence explanation based on evidence",
//   "keySignals": [
//     "e.g. 'No reverse image matches found'",
//     "e.g. 'ID number appears in data leak forums'",
//     "e.g. 'Design matches official UIDAI layout'"
//   ],
//   "recommendations": [
//     "e.g. 'Verify number on https://uidai.gov.in'",
//     "e.g. 'Check QR code digitally'",
//     "e.g. 'Compare photo with live capture'"
//   ]
// }
// `.trim();
// }

// /**
//  * Generate a hybrid verification prompt blending Serper results and live web search instructions
//  * @param {Object} param0 - Pipeline context
//  * @returns {string} Structured prompt for a web-enabled LLM
//  */
// export function generateHybridVerificationPrompt({
//   imageUrl,
//   ocrText,
//   visionDescription,
//   serperImageHits = [],
//   serperTextHits = [],
//   entities = {}
// }) {
//   const formattedOCR = (ocrText || "").trim() || "No OCR text extracted.";
//   const visionDesc = (visionDescription || "").trim() || "Vision analysis unavailable (timeout).";

//   const imageResults = Array.isArray(serperImageHits) && serperImageHits.length > 0
//     ? serperImageHits.map(hit =>
//         `- **${hit.title || 'No Title'}** (${hit.domain || 'unknown'})\n  ${hit.snippet || 'No snippet'}`
//       ).join('\n')
//     : "No similar images found online.";

//   const textResults = Array.isArray(serperTextHits) && serperTextHits.length > 0
//     ? serperTextHits.map(hit =>
//         `- **${hit.title || 'No Title'}** (${hit.domain || 'unknown'})\n  \"${hit.snippet || 'No snippet'}\"`
//       ).join('\n')
//     : "No relevant web pages found.";

//   return `
// You are a document authenticity investigator. Your task is to determine if the submitted Aadhaar card is real, forged, or a template.

// You will use:
// - ✅ My Serper.dev search results (provided below)
// - ✅ Your own live internet search (via web access)

// ---

// ### 📄 DOCUMENT DETAILS
// - **Image URL**: ${imageUrl || "Unknown"}
// - **Name**: ${entities.name || entities.names?.[0] || "Not found"}
// - **Aadhaar Number**: ${entities.id || entities.ids?.[0] || "Not found"}
// - **Year of Birth**: ${entities.year || entities.years?.[0] || "Not found"}
// - **Gender**: ${entities.gender || "Not found"}

// ---

// ### 🔤 OCR TEXT (Mistral)
// ${formattedOCR}

// ---

// ### 🖼️ VISUAL ANALYSIS (Gemini)
// ${visionDesc}

// ---

// ### 🔍 PHASE 1: MY SERPER.DEV SEARCH RESULTS

// #### Reverse Image Search:
// ${imageResults}

// #### Text-Based Web Search:
// ${textResults}

// ---

// ### 🔎 PHASE 2: YOUR TASK — SEARCH THE INTERNET AND VERIFY

// Use your **live web search capability** to investigate:

// 1. **Official Verification**
//    → Search: "site:uidai.gov.in ${entities.id || entities.ids?.[0] || ''}"  
//    → Is this Aadhaar number verifiable on the **official portal**?

// 2. **Data Leaks or Exposure**
//    → Search: "${entities.id || entities.ids?.[0] || ''} data leak", "Aadhaar breach 2023", "exposed Aadhaar list"  
//    → Has this number appeared in **breach reports**?

// 3. **Fraud or Misuse**
//    → Search: "${entities.name || entities.names?.[0] || ''} Aadhaar fraud", "${entities.id || entities.ids?.[0] || ''} fake KYC", "forged Aadhaar case"  
//    → Is this ID linked to **fraudulent accounts**?

// 4. **Template or Generator Sites**
//    → Search: "Aadhaar template editable", "Aadhaar card generator", "fake Aadhaar download"  
//    → Does this design match known **forgery tools**?

// 5. **News or Public Records**
//    → Search: "${entities.name || entities.names?.[0] || ''} ${entities.year || entities.years?.[0] || ''}", "election roll ${entities.name || entities.names?.[0] || ''}", "property owner ${entities.name || entities.names?.[0] || ''}"  
//    → Is this person mentioned in **public records**?

// ---

// ### 🧠 ANALYSIS RULES
// - Do **not trust** template, generator, or marketplace sites (e.g. GitHub, Telegram, PDF editors)
// - Prioritize **gov.in**, **uidai.gov.in**, **pib.gov.in**, **news outlets**
// - If **no evidence** of this ID/name online → consider it **highly suspicious**
// - Lack of digital footprint ≠ authenticity
// - Never invent sources

// ---

// ### ✅ OUTPUT FORMAT (JSON ONLY — NO MARKDOWN, NO EXPLANATION)
// {
//   "authenticity": "authentic|likely-forged|highly-suspicious|template|uncertain",
//   "confidence": 0-100,
//   "rationale": "Detailed justification using evidence.",
//   "sources": [
//     {"url": "", "title": "", "relevance": "high|medium|low", "summary": ""}
//   ],
//   "keySignals": [],
//   "recommendations": []
// }

// ---

// ### ⚠️ IMPORTANT
// - You **have web search enabled** — USE IT.
// - If no results found, say so — do **not hallucinate**.
// - Confidence < 60 if no corroboration.
// - Return **only JSON** — no extra text.

// RULES
// - Be factual and conservative.
// - If no evidence supports authenticity, lean toward "highly-suspicious".
// - If search results show templates, generators, or fraud guides, mark as "likely-forged".
// - If OCR or vision mentions "template", "sample", "void", "not valid", mark as "template".
// - If no image matches and ID not verifiable, confidence should be <60.
// - NEVER invent facts.
// `.trim();
// }


/**
 * Generate the LLM prompt for universal document forgery verification
 * Fixed to work with ANY document type and properly extract/use data
 * @param {Object} data - Input data from pipeline/report
 * @returns {string} Structured prompt for LLM consumption
 */
export function generateHybridVerificationPrompt(data) {
  const {
    ocr = {},
    vision = {},
    matches = {},
    input = {},
    searchPlan = {},
  } = data || {};

  // 🔍 DEBUG: Log what we're receiving (remove in production)
  console.log('🔍 DEBUG PROMPT GENERATOR:');
  console.log('OCR textPreview length:', ocr.textPreview?.length || 0);
  console.log('Vision description length:', vision.description?.length || 0);
  console.log('SearchPlan entities:', JSON.stringify(searchPlan.entities, null, 2));
  console.log('SearchPlan documentType:', searchPlan.documentType);

  // Enhanced document type detection with debugging
  const detectedType = detectDocumentTypeFromOCR(ocr.textPreview);
  const docType = searchPlan.documentType || 
                  vision.documentType || 
                  detectedType || 
                  "Unknown document";

  console.log('🎯 Detected docType from OCR:', detectedType);
  console.log('🎯 Final docType:', docType);

  // Gather and sanitize main fields
  const ocrText = (ocr.textPreview || "").trim() || "No OCR text extracted.";
  const visionDesc = (vision.description || "").trim() || "Vision analysis unavailable (timeout).";

  // Enhanced image hits analysis
  const imageHits = Array.isArray(matches.imageHits) && matches.imageHits.length > 0
    ? matches.imageHits.map(hit =>
        `- **${hit.title || 'No Title'}** (${hit.domain || 'unknown'}): ${hit.snippet || 'No snippet'}`
      ).join('\n')
    : "No similar images found online.";

  // Enhanced text hits analysis
  const textHits = Array.isArray(matches.textHits) && matches.textHits.length > 0
    ? matches.textHits.map(hit =>
        `- **${hit.title || 'No Title'}** (${hit.domain || 'unknown'}): ${hit.snippet || 'No snippet'}`
      ).join('\n')
    : "No relevant text results found.";

  // Universal entity extraction with debugging
  const entities = searchPlan.entities || {};
  console.log('🔍 Raw entities:', entities);
  
  // Fixed entity mapping for all document types
  const documentNumbers = extractDocumentNumbers(entities, ocr.textPreview, vision.description);
  const personalInfo = extractPersonalInfo(entities, ocr.textPreview, vision.description);
  const issuanceInfo = extractIssuanceInfo(entities, ocr.textPreview, vision.description);
  const locationInfo = extractLocationInfo(entities, ocr.textPreview, vision.description);

  console.log('🔍 Extracted info:');
  console.log('  documentNumbers:', documentNumbers.substring(0, 100));
  console.log('  personalInfo:', personalInfo.substring(0, 100));

  // Generate document-specific verification guidelines
  const verificationGuidelines = generateVerificationGuidelines(docType, entities);

  // Compose universal prompt
  return `
You are a global document authenticity and fraud detection expert with expertise in identity documents, certificates, licenses, and official papers from all countries and organizations worldwide.

Your task is to analyze the provided evidence and determine the authenticity of the submitted document using forensic document examination principles, web intelligence, and knowledge of international document security features.

# DOCUMENT ANALYSIS

## Document Classification
**Detected Type**: ${docType}

## Source Information  
**Image URL**: ${input.imageUrl || "Unknown"}

## Extracted Content Analysis

### Document Numbers & Identifiers
${documentNumbers}

### Personal Information
${personalInfo}

### Issuance Information
${issuanceInfo}

### Geographic Information
${locationInfo}

### Complete OCR Text
\`\`\`
${ocrText}
\`\`\`

## Visual Forensic Analysis
${visionDesc}

## Web Intelligence Results

### Reverse Image Search
${imageHits}

### Text-Based Intelligence
${textHits}

# VERIFICATION INSTRUCTIONS

${verificationGuidelines}

# ANALYSIS FRAMEWORK

Use the following criteria for your assessment:

## Security Features Analysis
- Verify presence of expected security elements (watermarks, holograms, special inks, microtext)
- Check alignment and consistency of design elements
- Assess print quality and paper characteristics

## Data Consistency Verification  
- Cross-reference personal information for logical consistency
- Validate number sequences and check digits where applicable
- Verify date formats and chronological logic

## Digital Footprint Analysis
- Assess web search results for authenticity indicators
- Identify any fraud, template, or generator site connections
- Evaluate official portal verification possibilities

## Template and Fraud Detection
- Compare against known template patterns and generator signatures
- Identify suspicious placeholder text or generic information
- Assess likelihood of digital manipulation or synthesis

# OUTPUT REQUIREMENTS

Provide your analysis in **strict JSON format only** with the following structure:

{
  "documentType": "${docType}",
  "authenticity": "authentic|likely-authentic|uncertain|likely-forged|highly-suspicious|template|invalid-document-type",
  "confidence": 0-100,
  "riskLevel": "low|medium|high|critical",
  "rationale": "Detailed explanation of your assessment based on available evidence, citing specific findings and their implications for authenticity",
  "securityFeatures": {
    "present": ["list of security features identified"],
    "missing": ["expected features not found"],
    "suspicious": ["features that appear fake or manipulated"]
  },
  "dataConsistency": {
    "consistent": ["logically consistent data points"],
    "inconsistent": ["data anomalies or contradictions"],
    "unverifiable": ["information that cannot be cross-verified"]
  },
  "webIntelligence": {
    "officialSources": ["relevant government or issuer sources found"],
    "fraudIndicators": ["suspicious or fraud-related findings"],
    "templateMatches": ["template or generator site connections"]
  },
  "keyFindings": [
    "Most significant evidence supporting or undermining authenticity",
    "Critical security feature observations",
    "Important web intelligence discoveries",
    "Notable data consistency issues"
  ],
  "recommendations": [
    "Primary verification steps (official portals, apps, databases)",
    "Secondary authentication measures (live verification, supporting docs)",
    "Risk mitigation actions (manual review, rejection, additional screening)",
    "Specific technical verification methods for this document type"
  ],
  "verificationResources": [
    "Official websites and portals for verification",
    "Government databases and checking systems", 
    "Mobile apps and digital verification tools",
    "Contact information for issuing authorities"
  ]
}

# CRITICAL GUIDELINES

- **Use the actual data provided**: The OCR text, vision analysis, and entity data contain real information about this document
- **Never fabricate information**: Only use evidence provided in the analysis
- **Be conservative**: If evidence is insufficient, indicate uncertainty rather than guessing
- **Consider context**: Different document types have different verification standards
- **Prioritize official sources**: Government and issuer websites are most reliable
- **Document your reasoning**: Explain how specific evidence led to your conclusions
- **Account for variations**: Legitimate documents may have regional or temporal variations
- **Flag obvious fakes**: Templates, generators, and clear forgeries should be identified
- **Recommend appropriate actions**: Tailor recommendations to the specific document and risk level

Return ONLY the JSON response with no additional text or formatting.
`.trim();
}

/**
 * FIXED Helper function to detect document type from OCR text
 */
function detectDocumentTypeFromOCR(ocrText) {
  if (!ocrText) return null;
  
  const text = ocrText.toLowerCase();
  
  // FIXED: Passport indicators - more flexible MRZ detection
  if (text.includes('passport') || text.includes('passeport') || text.includes('pasaporte') || 
      text.includes('type p') || /p<[a-z]{1,}<</.test(text) || text.includes('mrz')) {
    return "Passport";
  }
  
  // National ID indicators
  if (text.includes('national id') || text.includes('identity card') || text.includes('carte d\'identité') || 
      text.includes('personalausweis') || text.includes('aadhaar') || text.includes('aadhar')) {
    return "National Identity Card";
  }
  
  // Driver's license indicators
  if (text.includes('driver') || text.includes('driving') || text.includes('license') || 
      text.includes('permis de conduire') || text.includes('führerschein')) {
    return "Driver's License";
  }
  
  // Visa indicators
  if (text.includes('visa') || text.includes('entry') || text.includes('immigration')) {
    return "Visa";
  }
  
  // Certificate indicators
  if (text.includes('certificate') || text.includes('certified') || text.includes('diplom') || 
      text.includes('certificat')) {
    return "Certificate/Diploma";
  }
  
  // Residence permit indicators
  if (text.includes('residence') || text.includes('permit') || text.includes('aufenthaltstitel')) {
    return "Residence Permit";
  }
  
  return null;
}

/**
 * FIXED Helper function to extract document numbers
 */
function extractDocumentNumbers(entities, ocrText = '', visionDesc = '') {
  const numbers = [];
  
  // Extract from entities
  if (entities.ids?.length) {
    const realIds = entities.ids.filter(id => 
      !id.includes('United Arab Emirates') && 
      !id.includes('Passport Number') &&
      id.length > 2
    );
    if (realIds.length) numbers.push(`Document IDs: ${realIds.join(', ')}`);
  }
  
  if (entities.numbers?.length) {
    const realNumbers = entities.numbers.filter(num => 
      !num.includes('Passport Number') && 
      num.length > 2
    );
    if (realNumbers.length) numbers.push(`Document Numbers: ${realNumbers.join(', ')}`);
  }
  
  if (entities.passportNumbers?.length) {
    numbers.push(`Passport Numbers: ${entities.passportNumbers.join(', ')}`);
  }
  
  if (entities.licenseNumbers?.length) {
    numbers.push(`License Numbers: ${entities.licenseNumbers.join(', ')}`);
  }
  
  // FALLBACK: Extract from vision description if entities are empty
  if (numbers.length === 0 && visionDesc) {
    const passportMatch = visionDesc.match(/passport number[:\s]*([A-Z0-9]+)/i);
    if (passportMatch) {
      numbers.push(`Passport Number: ${passportMatch[1]}`);
    }
    
    const idMatch = visionDesc.match(/ID[:\s]*([A-Z0-9]{6,})/i);
    if (idMatch) {
      numbers.push(`ID Number: ${idMatch[1]}`);
    }
  }
  
  return numbers.length ? numbers.join('\n') : "No document numbers detected";
}

/**
 * FIXED Helper function to extract personal information
 */
function extractPersonalInfo(entities, ocrText = '', visionDesc = '') {
  const info = [];
  
  // Extract from entities, filtering out generic labels
  if (entities.names?.length) {
    const realNames = entities.names.filter(name => 
      !name.includes('United Arab Emirates') && 
      !name.includes('Passport Number') &&
      !name.includes('Issuing Authority') &&
      !name.includes('Country Code') &&
      !name.includes('The Arabic') &&
      name.length > 2
    );
    if (realNames.length) info.push(`Names: ${realNames.join(', ')}`);
  }
  
  if (entities.firstNames?.length) info.push(`First Names: ${entities.firstNames.join(', ')}`);
  if (entities.lastNames?.length) info.push(`Last Names: ${entities.lastNames.join(', ')}`);
  if (entities.years?.length) info.push(`Birth Years: ${entities.years.join(', ')}`);
  if (entities.dates?.length) info.push(`Important Dates: ${entities.dates.join(', ')}`);
  if (entities.genders?.length) info.push(`Gender: ${entities.genders.join(', ')}`);
  if (entities.age) info.push(`Age: ${entities.age}`);
  
  // FALLBACK: Extract from vision description if entities are insufficient
  if (info.length <= 1 && visionDesc) {
    const nameMatch = visionDesc.match(/name[:\s]*([A-Z][A-Z\s\-\.]{2,30})/i);
    if (nameMatch && !nameMatch[1].includes('UNITED ARAB')) {
      info.push(`Name from Vision: ${nameMatch[1].trim()}`);
    }
    
    const dobMatch = visionDesc.match(/date of birth[:\s]*([0-9\/\-\.]{6,12})/i);
    if (dobMatch) {
      info.push(`Date of Birth: ${dobMatch[1]}`);
    }
    
    const sexMatch = visionDesc.match(/sex[:\s]*([MF]|Male|Female)/i);
    if (sexMatch) {
      info.push(`Gender: ${sexMatch[1]}`);
    }
  }
  
  return info.length ? info.join('\n') : "No personal information detected";
}

/**
 * FIXED Helper function to extract issuance information
 */
function extractIssuanceInfo(entities, ocrText = '', visionDesc = '') {
  const info = [];
  
  if (entities.issuer) info.push(`Issuing Authority: ${entities.issuer}`);
  if (entities.issuers?.length) {
    const realIssuers = entities.issuers.filter(issuer => 
      !issuer.includes('Issuing Authority') && issuer.length > 2
    );
    if (realIssuers.length) info.push(`Issuing Authorities: ${realIssuers.join(', ')}`);
  }
  
  if (entities.issueDate) info.push(`Issue Date: ${entities.issueDate}`);
  if (entities.expiryDate) info.push(`Expiry Date: ${entities.expiryDate}`);
  if (entities.validFrom) info.push(`Valid From: ${entities.validFrom}`);
  if (entities.validUntil) info.push(`Valid Until: ${entities.validUntil}`);
  
  // FALLBACK: Extract from vision description
  if (info.length === 0 && visionDesc) {
    const issueMatch = visionDesc.match(/date of issue[:\s]*([0-9\/\-\.]{6,12})/i);
    if (issueMatch) {
      info.push(`Issue Date: ${issueMatch[1]}`);
    }
    
    const expiryMatch = visionDesc.match(/date of expiry[:\s]*([0-9\/\-\.]{6,12})/i);
    if (expiryMatch) {
      info.push(`Expiry Date: ${expiryMatch[1]}`);
    }
    
    const authorityMatch = visionDesc.match(/issuing authority[:\s]*([A-Z][A-Z\s]{5,40})/i);
    if (authorityMatch) {
      info.push(`Issuing Authority: ${authorityMatch[1].trim()}`);
    }
  }
  
  return info.length ? info.join('\n') : "No issuance information detected";
}

/**
 * FIXED Helper function to extract location information
 */
function extractLocationInfo(entities, ocrText = '', visionDesc = '') {
  const info = [];
  
  if (entities.nationality) info.push(`Nationality: ${entities.nationality}`);
  if (entities.nationalities?.length) {
    const realNationalities = entities.nationalities.filter(nat => 
      nat !== 'United Arab Emirates' || entities.nationalities.length === 1
    );
    if (realNationalities.length) info.push(`Nationalities: ${realNationalities.join(', ')}`);
  }
  
  if (entities.country) info.push(`Country: ${entities.country}`);
  if (entities.countries?.length) info.push(`Countries: ${entities.countries.join(', ')}`);
  if (entities.birthPlace) info.push(`Place of Birth: ${entities.birthPlace}`);
  if (entities.address) info.push(`Address: ${entities.address}`);
  if (entities.city) info.push(`City: ${entities.city}`);
  if (entities.state) info.push(`State/Province: ${entities.state}`);
  
  // FALLBACK: Extract from vision description
  if (info.length === 0 && visionDesc) {
    const nationalityMatch = visionDesc.match(/nationality[:\s]*([A-Z][A-Za-z\s]{3,30})/i);
    if (nationalityMatch) {
      info.push(`Nationality: ${nationalityMatch[1].trim()}`);
    }
    
    const birthPlaceMatch = visionDesc.match(/place of birth[:\s]*([A-Z][A-Za-z\s]{2,30})/i);
    if (birthPlaceMatch) {
      info.push(`Place of Birth: ${birthPlaceMatch[1].trim()}`);
    }
  }
  
  return info.length ? info.join('\n') : "No location information detected";
}

/**
 * Helper function to generate document-specific verification guidelines
 */
function generateVerificationGuidelines(docType, entities) {
  const type = docType.toLowerCase();
  
  if (type.includes('passport')) {
    return `
## Passport Verification Guidelines
- Verify Machine Readable Zone (MRZ) formatting and check digits
- Validate passport number format against issuing country standards  
- Check biographical data page security features (watermarks, intaglio printing)
- Verify issuing authority against official government sources
- Cross-reference with INTERPOL stolen/lost passport database if available
- Validate visa stamps and entry/exit records where applicable`;
  }
  
  if (type.includes('aadhaar') || type.includes('aadhar')) {
    return `
## Aadhaar Card Verification Guidelines
- Verify 12-digit Aadhaar number format and check digit algorithm
- Validate against UIDAI official verification portal
- Check QR code authenticity and embedded data consistency
- Verify security features (watermarks, microtext, holographic elements)
- Cross-reference with official UIDAI design templates
- Check for known template or generator signatures`;
  }
  
  if (type.includes('driver') || type.includes('license')) {
    return `
## Driver's License Verification Guidelines
- Verify license number format against issuing jurisdiction standards
- Check for state/provincial security features and design elements
- Validate against motor vehicle department databases where possible
- Verify class restrictions and endorsements formatting
- Check photo and signature quality and placement consistency
- Cross-reference with known template libraries for the jurisdiction`;
  }
  
  if (type.includes('national') || type.includes('identity')) {
    return `
## National ID Verification Guidelines
- Verify ID number format against national standards and algorithms
- Check for country-specific security features and design elements
- Validate against national identity databases where accessible
- Verify biographical information formatting and consistency
- Check for proper authority signatures and seals
- Cross-reference with known fraud patterns for the issuing country`;
  }
  
  if (type.includes('visa')) {
    return `
## Visa Verification Guidelines
- Verify visa number and format against issuing country standards
- Check for embassy/consulate specific security features
- Validate dates (issue, validity, entry periods) for logical consistency
- Verify visa category and restrictions formatting
- Cross-reference with diplomatic mission design templates
- Check for proper official seals and signatures`;
  }
  
  // Generic guidelines for unknown document types
  return `
## General Document Verification Guidelines
- Analyze overall design quality and professional printing characteristics
- Check for consistent fonts, spacing, and layout alignment
- Verify any visible security features (watermarks, special inks, microtext)
- Validate data consistency and logical relationships
- Cross-reference with official sources where possible
- Look for signs of digital manipulation or template usage`;
}
