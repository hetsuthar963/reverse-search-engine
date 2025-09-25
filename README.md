# DocShield Reverse Image Search Engine

A sophisticated Node.js-based reverse image search and document forgery detection system designed specifically for analyzing Identity Images. This engine combines multiple AI services to perform comprehensive document authenticity verification through visual analysis, OCR extraction, entity recognition, and web-based corroboration.

## 🚀 Features

- **Multi-Modal Analysis**: Integrates vision AI, OCR, and web search for comprehensive document verification
- **Document Forgery Detection**: Specialized for Aadhaar card authenticity assessment
- **Entity Extraction**: Automatically identifies IDs, names, dates, and other key information
- **Reverse Image Search**: Finds similar images across the web using advanced search APIs
- **Text-Based Verification**: Cross-references extracted data with online sources
- **Confidence Scoring**: Provides authenticity ratings with detailed reasoning
- **Performance Monitoring**: Built-in timing and logging for optimization
- **Modular Architecture**: Easily extensible for other document types

## 🛠️ Technologies Used

### Core Technologies
- **Node.js** - Runtime environment
- **ES6 Modules** - Modern JavaScript module system
- **Axios** - HTTP client for API interactions
- **Sharp** - High-performance image processing
- **Pino** - Fast and structured logging
- **Dotenv** - Environment variable management

### AI & ML Services
- **Google Gemini AI** - Vision analysis and document description
- **Mistral AI** - OCR text extraction from images
- **Perplexity AI** - Advanced reasoning and verification prompts
- **Serper.dev** - Reverse image search and web scraping

### Development Tools
- **Form-Data** - Multipart form handling
- **Pino-Pretty** - Human-readable log formatting

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- API keys for:
  - Google Gemini AI
  - Mistral AI
  - Serper.dev
  - Perplexity AI

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reverse-image-search
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key_here

   # Mistral AI
   MISTRAL_API_KEY=your_mistral_api_key_here

   # Serper.dev (for search)
   SERPER_API_KEY=your_serper_api_key_here

   # Perplexity AI
   PERPLEXITY_API_KEY=your_perplexity_api_key_here

   # Optional: Logging level
   LOG_LEVEL=info
   ```

4. **Verify installation**
   ```bash
   node -c index.js
   ```

## 🚀 Usage

### Command Line Interface

Run the reverse search engine with an image URL:

```bash
node index.js <image-url>
```

**Example:**
```bash
node index.js https://example.com/aadhaar-sample.jpg
```

### Programmatic Usage

```javascript
import { runReverseSearch } from './src/engine.js';

const result = await runReverseSearch('https://example.com/aadhaar-image.jpg');
console.log(JSON.stringify(result, null, 2));
```

### Output Format

The engine returns a comprehensive JSON report including:

```json
{
  "generatedAt": "2025-09-25T14:57:24.361Z",
  "input": {
    "imageUrl": "https://xverticebucket.s3.us-east-1.amazonaws.com/uploads/1744263262901-20.png"
  },
  "ocr": {
    "textPreview": "# We the People \n\nOf the United States, in Order to form a more perfect Union…\nP <USAJENNINGS<<EVELYN<<<<<<<<<<<<<<<<<4342867238 USA6690715F9948816678<198199",
    "error": null
  },
  "vision": {
    "description": "The image is a scan of a United States passport page. … The photo is from this-person-does-not-exist.com, indicating it’s AI-generated.",
    "error": null
  },
  "matches": {
    "imageHits": [
      {
        "title": "Labuda hi-res stock photography and images - Alamy",
        "url": "https://c8.alamy.com/comp/PM5GMF/film-still.jpg",
        "sourceUrl": "https://www.alamy.com/stock-photo/labuda.html",
        "domain": "alamy.com",
        "position": 1,
        "snippet": "",
        "tags": []
      }
    ],
    "textHits": [
      {
        "query": "\"4342867238\"",
        "title": "Bosch Siemens 11021999 heating element",
        "url": "https://fixpart.co.uk/product/bosch-siemens-4342867238-heating-element",
        "snippet": "Part Number: 4342867238 …",
        "domain": "fixpart.co.uk",
        "position": 1
      },
      {
        "query": "\"4342867238\" passport",
        "title": "1000000-most-common-passwords.txt",
        "url": "https://lucidar.me/en/security/files/1000000-most-common-passwords.txt",
        "snippet": "... passport password list includes 4342867238 …",
        "domain": "lucidar.me",
        "position": 1
      }
    ]
  },
  "stats": {
    "imageHitCount": 1,
    "textHitCount": 2
  },
  "keyFindings": [
    "1 visually similar image detected (stock-photo site)",
    "No official or government references found for this passport number",
    "Passport photo is clearly AI-generated (this-person-does-not-exist.com)"
  ],
  "searchPlan": {
    "imageUrl": "https://xverticebucket.s3.us-east-1.amazonaws.com/uploads/1744263262901-20.png",
    "ocrText": "# We the People … P <USAJENNINGS<<EVELYN…",
    "visionDescription": "The image is a scan of a United States passport page…",
    "documentType": "passport",
    "entities": {
      "ids": ["4342867238","6690715","9948816678","198199","434286723"],
      "names": ["United States","Passport Information","Given Names","Issuing Authority"],
      "years": ["1972","1988","1998"],
      "genders": ["Female"],
      "baseTerms": ["passport","united","america","birth"],
      "documentType": "passport",
      "id": "4342867238",
      "name": "United States",
      "year": "1972",
      "gender": "Female"
    },
    "primaryQuery": "\"4342867238\" \"passport\"",
    "textQueries": [
      "\"4342867238\"",
      "\"4342867238\" \"passport\"",
      "\"4342867238\" passport verification",
      "\"4342867238\" data leak",
      "\"4342867238\" fraud",
      "\"4342867238\" passport template",
      "\"United States\" \"passport\"",
      "passport generator"
    ]
  },
  "timings": [
    { "label": "fetchImage", "durationMs": 4882, "status": "ok" },
    { "label": "mistralOCR", "durationMs": 2190, "status": "ok" },
    { "label": "geminiVision", "durationMs": 8360, "status": "ok" },
    { "label": "serperReverseImage", "durationMs": 1861, "status": "ok" },
    { "label": "serperTextSearch", "durationMs": 2097, "status": "ok" }
  ],
  "verification": {
    "documentType": "passport",
    "authenticity": "highly-suspicious",
    "confidence": 5,
    "riskLevel": "critical",
    "rationale": "Passport photo is AI-generated; no official matches; security features missing.",
    "keySignals": [
      "AI-generated photo",
      "No government references",
      "Generic part-number matches"
    ],
    "recommendations": [
      "Reject document as invalid",
      "Request physical inspection",
      "Verify via official State Department portal"
    ],
    "verificationResources": [
      "https://travel.state.gov",
      "https://www.interpol.int/Sltd"
    ]
  }
}

```

## 🔍 How It Works

### 1. Image Processing Pipeline
- **Image Fetching**: Downloads and converts image to base64
- **OCR Extraction**: Uses Mistral AI to extract text from the image
- **Vision Analysis**: Employs Gemini AI to describe visual elements
- **Entity Recognition**: Identifies key information (IDs, names, dates)

### 2. Search Strategy
- **Search Plan Generation**: Builds targeted queries based on extracted entities
- **Reverse Image Search**: Finds visually similar images using Serper
- **Text-Based Search**: Cross-references data with web sources
- **Domain-Specific Queries**: Targets official and relevant websites

### 3. Verification Process
- **Cross-Correlation**: Matches OCR, vision, and search results
- **Authenticity Scoring**: Applies rules-based logic for confidence assessment
- **Report Generation**: Compiles findings into structured output

### 4. AI Reasoning
- **Prompt Engineering**: Uses sophisticated prompts for LLM analysis
- **Hybrid Verification**: Combines pre-computed search results with live web access
- **Conservative Approach**: Prioritizes factual evidence over speculation

## 📁 Project Structure

```
reverse-image-search/
├── src/
│   ├── services/
│   │   ├── gemini.js          # Google Gemini AI integration
│   │   ├── mistral.js         # Mistral OCR service
│   │   ├── serper.js          # Serper search API
│   │   ├── perplexity.js      # Perplexity AI reasoning
│   │   └── fetchImage.js      # Image downloading utilities
│   ├── utils/
│   │   ├── prompt.js          # LLM prompt templates
│   │   ├── queryBuilder.js    # Search query generation
│   │   ├── logger.js          # Logging utilities
│   │   └── timing.js          # Performance measurement
│   ├── engine.js              # Main orchestration logic
│   ├── config.js              # Configuration management
│   └── report.js              # Report generation
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── index.js                   # CLI entry point
└── README.md                  # This file
```

## 🔐 Security Considerations

- **API Key Management**: Store API keys securely in environment variables
- **Rate Limiting**: Implement appropriate delays between API calls
- **Data Privacy**: Handle sensitive document data with care
- **Error Handling**: Graceful degradation when services are unavailable

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Note: Currently, the test script is a placeholder. Consider adding unit tests for:
- Individual service integrations
- Entity extraction accuracy
- Search query generation
- Report formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ES6+ best practices
- Add JSDoc comments for functions
- Use meaningful variable names
- Implement error handling
- Write modular, reusable code

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the logs for detailed error information
- Ensure all required API keys are properly configured

## 🔮 Future Enhancements

- Support for additional document types (PAN, Passport, etc.)
- Batch processing capabilities
- Web-based UI for easier interaction
- Machine learning model training for improved accuracy
- Integration with blockchain for tamper-proof verification

---

**Built with ❤️ for document security and authenticity verification**
