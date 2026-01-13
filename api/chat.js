import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load CUET data files
let cuetData = null;
let bulletinData = null;

try {
  const dataPath = join(__dirname, '..', 'cuet-data.json');
  cuetData = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (error) {
  console.error('Failed to load CUET course data:', error.message);
}

try {
  const bulletinPath = join(__dirname, '..', 'cuet-2026-bulletin.json');
  bulletinData = JSON.parse(readFileSync(bulletinPath, 'utf8'));
} catch (error) {
  console.error('Failed to load CUET 2026 bulletin:', error.message);
}

// Official CUET 2026 information (hardcoded as backup)
const CUET_2026_INFO = `
CUET UG 2026 - OFFICIAL INFORMATION (NTA)

📅 IMPORTANT DATES:
• Online Application: 03-30 January 2026
• Fee Payment Deadline: 31 January 2026
• Correction Window: 02-04 February 2026
• Examination: 11-31 May 2026 (Tentative)
• Website: https://cuet.nta.nic.in

💰 FEE STRUCTURE:
• General (UR): ₹1000 (up to 3 subjects) + ₹400 each additional
• OBC-NCL / EWS: ₹900 + ₹375 each additional
• SC/ST/PwD: ₹800 + ₹350 each additional

📝 EXAM PATTERN:
• Mode: Computer Based Test (CBT)
• Medium: 13 Languages
• Maximum Subjects: 5
• Questions: 50 per paper (All Compulsory)
• Duration: 60 minutes per paper
• Marking: +5 correct, -1 incorrect

📚 SUBJECTS (Total 37):
Languages (13): English, Hindi, Assamese, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu

Domain Subjects (23): Accountancy, Agriculture, Anthropology, Biology/Biotech, Business Studies, Chemistry, Computer Science, Economics, Environmental Science, Fine Arts, Geography/Geology, History, Home Science, Knowledge Tradition, Mass Media, Mathematics, Performing Arts, Physical Education, Physics, Political Science, Psychology, Sanskrit, Sociology

General Test (1): General Aptitude Test

🏛️ 48 CENTRAL UNIVERSITIES participating

📞 NTA Helpdesk: cuet-ug@nta.ac.in | 011-40759000
`;

// Search courses
function searchCourses(query) {
  if (!cuetData?.universities) return [];
  
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);
  
  if (keywords.length === 0) return [];
  
  return cuetData.universities.filter(course => {
    const searchText = `${course.university_name || ''} ${course.university_short || ''} ${course.course_name || ''} ${course.course_category || ''} ${course.location || ''} ${course.stream_12th || ''}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  }).slice(0, 30);
}

// Format courses
function formatCourses(courses) {
  if (!courses.length) return 'No matching courses found.';
  
  return courses.map(c => 
    `• ${c.course_name} at ${c.university_name} (${c.university_short}), ${c.location}
  Category: ${c.course_category} | 12th: ${c.stream_12th}
  CUET Language: ${c.cuet_language_req}
  Domain Subjects: ${c.cuet_domain_subjects_req}
  General Test: ${c.cuet_general_test_req}
  Notes: ${c.comments}`
  ).join('\n\n');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured. Please add GEMINI_API_KEY to Vercel environment variables.' });
  }

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Search for relevant courses
    const courses = searchCourses(message);
    const coursesInfo = formatCourses(courses);
    
    // Build database stats
    const dbStats = cuetData 
      ? `Database: ${cuetData.metadata?.total_courses || 0} courses from ${cuetData.metadata?.total_universities || 0} universities`
      : 'Course database not loaded';

    const systemPrompt = `You are Jarmana, an AI assistant by Nudge Academy for CUET UG 2026 guidance.

${CUET_2026_INFO}

${dbStats}

RELEVANT COURSES FOR THIS QUERY:
${coursesInfo}

GUIDELINES:
1. Be encouraging and student-friendly
2. Use official data for dates, fees, exam pattern
3. Use course database for university-specific requirements
4. Keep responses concise with bullet points
5. For non-CUET questions: "I'm Jarmana, your CUET expert! How can I help with CUET?"
6. Always boost student confidence!`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
          ]
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return res.status(500).json({ error: data.error.message || 'API error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
