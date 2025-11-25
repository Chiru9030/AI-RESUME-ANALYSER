const http = require('http');

const PORT = process.env.PORT || 8080;

// HTML Content Inlined
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Resume Analyzer</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { max-width: 900px; width: 100%; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); padding: 48px; animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        h1 { font-size: 42px; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; text-align: center; }
        .subtitle { text-align: center; color: #64748b; font-size: 16px; margin-bottom: 40px; }
        .upload-area { border: 3px dashed #cbd5e1; border-radius: 16px; padding: 60px 20px; text-align: center; cursor: pointer; transition: all 0.3s ease; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); margin-bottom: 24px; }
        .upload-area:hover { border-color: #667eea; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); transform: translateY(-2px); }
        .upload-area.dragover { border-color: #667eea; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); transform: scale(1.02); }
        .upload-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.6; }
        .upload-text { font-size: 18px; color: #475569; font-weight: 600; margin-bottom: 8px; }
        .upload-subtext { font-size: 14px; color: #94a3b8; }
        input[type="file"] { display: none; }
        .job-description { margin-bottom: 24px; }
        .job-description label { display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px; }
        .job-description textarea { width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 120px; transition: all 0.3s ease; }
        .job-description textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        .analyze-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); }
        .analyze-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4); }
        .analyze-btn:active { transform: translateY(0); }
        .analyze-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .loading { display: none; text-align: center; padding: 40px; }
        .loading.active { display: block; }
        .spinner { border: 4px solid #f3f4f6; border-top: 4px solid #667eea; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .results { display: none; margin-top: 32px; padding: 32px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; animation: slideIn 0.5s ease-out; }
        .results.active { display: block; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .score-card { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .score-title { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
        .score-value { font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .analysis-section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .analysis-section h3 { font-size: 18px; color: #1e293b; margin-bottom: 16px; font-weight: 700; }
        .analysis-section p, .analysis-section ul { color: #475569; line-height: 1.7; font-size: 15px; }
        .analysis-section ul { padding-left: 20px; }
        .analysis-section li { margin-bottom: 8px; }
        .error { display: none; padding: 16px; background: #fee2e2; border: 2px solid #fecaca; border-radius: 12px; color: #991b1b; margin-top: 16px; }
        .error.active { display: block; }
        .file-info { display: none; padding: 16px; background: #dbeafe; border-radius: 12px; margin-bottom: 16px; color: #1e40af; font-size: 14px; }
        .file-info.active { display: block; }
        @media (max-width: 768px) { .container { padding: 32px 24px; } h1 { font-size: 32px; } .upload-area { padding: 40px 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Resume Analyzer</h1>
        <p class="subtitle">Upload your resume and get instant AI-powered feedback on ATS compatibility, skill gaps, and role fit!</p>
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📄</div>
            <div class="upload-text">Click to upload or drag and drop</div>
            <div class="upload-subtext">PDF, JPG, PNG (MAX. 10MB)</div>
            <input type="file" id="fileInput" accept=".pdf, .jpg, .jpeg, .png">
        </div>
        <div class="file-info" id="fileInfo"></div>
        <div class="job-description">
            <label for="jobDesc">Job Description (Optional)</label>
            <textarea id="jobDesc" placeholder="Paste the job description here to get a tailored analysis..."></textarea>
        </div>
        <button class="analyze-btn" id="analyzeBtn" disabled>Analyze Resume</button>
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Analyzing your resume with AI...</p>
        </div>
        <div class="error" id="error"></div>
        <div class="results" id="results"></div>
    </div>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        let selectedFile = null;
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const fileInfo = document.getElementById('fileInfo');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const results = document.getElementById('results');
        const jobDesc = document.getElementById('jobDesc');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) handleFile(e.target.files[0]); });

        function handleFile(file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) { 
                showError('Error: Incorrect file uploaded. Please upload a PDF or Image (JPG/PNG) file.'); 
                return; 
            }
            if (file.size > 10 * 1024 * 1024) { showError('File size must be less than 10MB'); return; }
            selectedFile = file;
            fileInfo.textContent = \`✓ \${file.name} (\${(file.size / 1024).toFixed(1)} KB)\`;
            fileInfo.classList.add('active');
            analyzeBtn.disabled = false;
            error.classList.remove('active');
        }

        analyzeBtn.addEventListener('click', analyzeResume);

        async function extractTextFromPDF(file) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\\n';
            }
            return fullText;
        }

        async function extractTextFromImage(file) {
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            await worker.terminate();
            return ret.data.text;
        }

        function validateContent(text) {
            const keywords = ['experience', 'education', 'skills', 'work history', 'project', 'summary', 'profile', 'cv', 'resume', 'contact', 'references'];
            const lowerText = text.toLowerCase();
            let matchCount = 0;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) matchCount++;
            }
            return matchCount >= 2;
        }

        async function analyzeResume() {
            if (!selectedFile) return;
            loading.classList.add('active');
            results.classList.remove('active');
            error.classList.remove('active');
            analyzeBtn.disabled = true;
            try {
                let resumeText = '';
                if (selectedFile.type === 'application/pdf') {
                    resumeText = await extractTextFromPDF(selectedFile);
                } else {
                    resumeText = await extractTextFromImage(selectedFile);
                }

                if (!resumeText.trim()) throw new Error('Could not extract text from file');
                
                if (!validateContent(resumeText)) {
                    throw new Error('Uploaded file does not appear to be a valid Resume/CV. Please upload a relevant document.');
                }

                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resumeText: resumeText, jobDescription: jobDesc.value })
                });
                if (!response.ok) throw new Error('Analysis failed');
                const data = await response.json();
                displayResults(data);
            } catch (err) {
                showError(err.message || 'Failed to analyze resume. Please try again.');
            } finally {
                loading.classList.remove('active');
                analyzeBtn.disabled = false;
            }
        }

        function displayResults(data) {
            const analysis = data.analysis;
            results.innerHTML = \`
                <div class="score-card">
                    <div class="score-title">ATS Compatibility Score</div>
                    <div class="score-value">\${analysis.atsScore || 'N/A'}/100</div>
                </div>
                <div class="analysis-section">
                    <h3>📊 Overall Assessment</h3>
                    <p>\${analysis.summary || 'No summary available'}</p>
                </div>
                <div class="analysis-section">
                    <h3>🎯 Skill Gaps</h3>
                    <p>\${analysis.skillGaps || 'No skill gaps identified'}</p>
                </div>
                <div class="analysis-section">
                    <h3>✨ Strengths</h3>
                    <p>\${analysis.strengths || 'No strengths identified'}</p>
                </div>
                <div class="analysis-section">
                    <h3>💡 Recommendations</h3>
                    <p>\${analysis.recommendations || 'No recommendations available'}</p>
                </div>
            \`;
            results.classList.add('active');
        }

        function showError(message) {
            error.textContent = '⚠️ ' + message;
            error.classList.add('active');
        }
    </script>
</body>
</html>`;

function getApiKey() {
    // For single file deployment, we'll default to Mock Mode if env var isn't set
    // This removes dependency on .env file
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your_api_key_here') {
        console.log('ℹ️  No GEMINI_API_KEY environment variable found. Using Mock Mode.');
        return null;
    }
    return key;
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(HTML_CONTENT);
        return;
    }

    if (req.url === '/api/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { resumeText, jobDescription } = JSON.parse(body);
                if (!resumeText) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Resume text is required' }));
                    return;
                }

                const apiKey = getApiKey();

                // Enhanced Mock Mode: Local Analysis Logic
                const analyzeLocal = (text) => {
                    const keywords = {
                        languages: ['Javascript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift'],
                        frontend: ['React', 'Angular', 'Vue', 'HTML', 'CSS', 'Redux', 'Webpack', 'Tailwind'],
                        backend: ['Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'PostgreSQL', 'MongoDB', 'SQL'],
                        cloud: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD'],
                        softSkills: ['Leadership', 'Communication', 'Agile', 'Scrum', 'Project Management', 'Teamwork']
                    };

                    const escapeRegExp = (string) => {
                        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    };

                    const foundSkills = {
                        languages: keywords.languages.filter(k => new RegExp(escapeRegExp(k), 'i').test(text)),
                        frontend: keywords.frontend.filter(k => new RegExp(escapeRegExp(k), 'i').test(text)),
                        backend: keywords.backend.filter(k => new RegExp(escapeRegExp(k), 'i').test(text)),
                        cloud: keywords.cloud.filter(k => new RegExp(escapeRegExp(k), 'i').test(text)),
                        softSkills: keywords.softSkills.filter(k => new RegExp(escapeRegExp(k), 'i').test(text))
                    };

                    const allFound = [...foundSkills.languages, ...foundSkills.frontend, ...foundSkills.backend, ...foundSkills.cloud, ...foundSkills.softSkills];

                    // Calculate a pseudo-score based on keyword density and variety
                    const scoreBase = 70;
                    const varietyBonus = (Object.values(foundSkills).filter(cat => cat.length > 0).length) * 5;
                    const countBonus = Math.min(allFound.length * 2, 15);
                    const atsScore = Math.min(scoreBase + varietyBonus + countBonus, 98);

                    // Generate Summary
                    let summary = "The candidate presents a solid profile";
                    if (foundSkills.languages.length > 2) summary += ` with strong versatility in programming languages (${foundSkills.languages.slice(0, 3).join(', ')}).`;
                    else if (foundSkills.frontend.length > 0) summary += ` focused on frontend development technologies.`;
                    else if (foundSkills.backend.length > 0) summary += ` with a focus on backend systems.`;
                    else summary += ".";

                    summary += " The resume is well-structured, though adding more quantifiable metrics could enhance impact.";

                    // Generate Strengths
                    const strengths = [];
                    if (foundSkills.cloud.length > 0) strengths.push("Modern cloud & DevOps competency");
                    if (foundSkills.softSkills.length > 0) strengths.push("Highlighted soft skills and leadership potential");
                    if (allFound.length > 5) strengths.push("Diverse technical skill set");
                    if (strengths.length === 0) strengths.push("Clear professional history", "Education credentials visible");

                    // Generate Gaps (Inverse of what's found)
                    const gaps = [];
                    if (foundSkills.cloud.length === 0) gaps.push("Cloud platforms (AWS/Azure)");
                    if (foundSkills.backend.length === 0 && foundSkills.frontend.length > 0) gaps.push("Backend integration knowledge");
                    if (foundSkills.frontend.length === 0 && foundSkills.backend.length > 0) gaps.push("Modern frontend frameworks");
                    if (gaps.length === 0) gaps.push("Advanced system architecture certifications");

                    return {
                        atsScore: atsScore,
                        summary: summary,
                        skillGaps: gaps.join(", "),
                        strengths: strengths.join(", "),
                        recommendations: "Quantify achievements with specific numbers (e.g., 'improved performance by 20%'). Ensure all dates are consistent. Tailor the summary to specific job descriptions."
                    };
                };

                // If no API key or if API fails, use local analysis
                if (!apiKey) {
                    console.log('ℹ️  Running in Local Analysis Mode (No API Key)');
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
                    try {
                        const analysis = analyzeLocal(resumeText);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ analysis }));
                    } catch (localError) {
                        console.error('Local Analysis Error:', localError);
                        if (!res.headersSent) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Local analysis failed' }));
                        }
                    }
                    return;
                }

                const prompt = `You are an expert resume analyzer and ATS (Applicant Tracking System) specialist. Analyze the following resume and provide detailed feedback.

Resume Content:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}

Please provide a comprehensive analysis in the following JSON format:
{
    "atsScore": <number between 0-100>,
    "summary": "<brief overall assessment>",
    "skillGaps": "<identified skill gaps${jobDescription ? ' compared to job description' : ''}>",
    "strengths": "<key strengths and highlights>",
    "recommendations": "<specific actionable recommendations>"
}

Respond ONLY with valid JSON, no additional text.`;

                try {
                    const geminiResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }]
                            })
                        }
                    );

                    if (!geminiResponse.ok) {
                        const errorText = await geminiResponse.text();
                        console.error(`Gemini API request failed: ${errorText}`);
                        console.log('⚠️  API call failed. Falling back to Local Mode.');

                        // Fallback to local analysis
                        const analysis = analyzeLocal(resumeText);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ analysis }));
                        return;
                    }

                    const geminiData = await geminiResponse.json();
                    const responseText = geminiData.candidates[0].content.parts[0].text;

                    let analysis;
                    try {
                        analysis = JSON.parse(responseText);
                    } catch (e) {
                        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                            responseText.match(/```\n([\s\S]*?)\n```/) ||
                            responseText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                        } else {
                            throw new Error('Could not parse AI response');
                        }
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ analysis }));
                } catch (apiError) {
                    console.error('API Error:', apiError);
                    console.log('⚠️  API execution failed. Falling back to Local Mode.');
                    try {
                        const analysis = analyzeLocal(resumeText);
                        if (!res.headersSent) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ analysis }));
                        }
                    } catch (fallbackError) {
                        console.error('Fallback Error:', fallbackError);
                        if (!res.headersSent) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Analysis failed' }));
                        }
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to analyze resume', details: error.message }));
                }
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`\n🚀 AI Resume Analyzer is running!`);
    console.log(`\n📱 Open in your browser: http://localhost:${PORT}`);
    console.log(`\n✨ Upload a PDF resume to get started!\n`);
});
