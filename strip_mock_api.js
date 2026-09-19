const fs = require('fs');
let content = fs.readFileSync('src/services/api.ts', 'utf8');

// Remove import
content = content.replace(/import \{ loadMockStore, saveMockStore \} from '\.\.\/data\/mockData';\n?/, '');

// Find handleLocalFallback function
const startIdx = content.indexOf('const handleLocalFallback =');
if (startIdx !== -1) {
    let braceCount = 0;
    let endIdx = -1;
    let started = false;
    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        if (started && braceCount === 0) {
            endIdx = i + 1;
            break;
        }
    }
    if (endIdx !== -1) {
        // Also find the closing semicolon if any
        if (content[endIdx] === ';') {
            endIdx++;
        }
        content = content.slice(0, startIdx) + content.slice(endIdx);
    }
}

// Remove references to handleLocalFallback in apiFetch
content = content.replace(
    /if \(DISABLE_MOCK_FALLBACK \|\| endpoint\.startsWith\('\/auth'\) \|\| response\.status >= 400\) \{[\s\S]*?\n\s*return handleLocalFallback\(endpoint, options\);/g,
    `if (response.status >= 400) {\n                throw new Error(errorMessage);\n            }`
);

content = content.replace(
    /if \(DISABLE_MOCK_FALLBACK \|\| endpoint\.startsWith\('\/auth'\)\) \{([\s\S]*?)\} else \{[\s\S]*?\}/g, // This might not match depending on exact syntax
    '' 
);

content = content.replace(
    /if \(DISABLE_MOCK_FALLBACK \|\| endpoint\.startsWith\('\/auth'\)\) \{[\s\S]*?throw err;\n\s*\}\n\s*\/\/ Fallback gracefully.*?\n\s*return handleLocalFallback\(endpoint, options\);/g,
    `if (err instanceof TypeError && err.message.includes('fetch')) {\n                throw new Error(\`Unable to connect to the backend server (\${url}). Please ensure the backend and MySQL database are running.\`);\n            }\n            throw err;`
);

content = content.replace(/const DISABLE_MOCK_FALLBACK = [\s\S]*?;/, '');

fs.writeFileSync('src/services/api.ts', content);
