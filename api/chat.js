import fs from 'fs';
import path from 'path';

// Load CUET data files at startup
let cuetData = null;
let bulletinData = null;

try {
  const dataPath = path.join(process.cwd(), 'cuet-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  cuetData = JSON.parse(rawData);
} catch (error) {
  console.error('Failed to load CUET course data:', error);
}

try {
  const bulletinPath = path.join(process.cwd(), 'cuet-2026-bulletin.json');
  const rawBulletin = fs.readFileSync(bulletinPath, 'utf8');
  bulletinData = JSON.parse(rawBulletin);
} catch (error) {
  console.error('Failed to load CUET 2026 bulletin:', error);
}

// Build official CUET 2026 information summary
function buildBulletinSummary() {
  return `
═══════════════════════════════════════════════════════════════
CUET UG 2026 - OFFICIAL INFORMATION (NTA Information Bulletin)
═══════════════════════════════════════════════════════════════

📅 IMPORTANT DATES:
• Online Application: 03-30 January 2026 (upto 11:50 PM)
• Fee Payment Deadline: 31 January 2026 (upto 11:50 PM)
• Correction Window: 02-04 February 2026 (upto 11:50 PM)
• Examination Dates: 11-31 May 2026 (Tentative)
• Website: https://cuet.nta.nic.in

💰 FEE STRUCTURE:
┌─────────────────────────────┬─────────────────┬─────────────────┐
│ Category                    │ Up to 3 Subjects│ Each Additional │
├─────────────────────────────┼─────────────────┼─────────────────┤
│ General (UR)                │ ₹1000           │ ₹400            │
│ OBC-NCL / EWS               │ ₹900            │ ₹375            │
│ SC/ST/PwD/Third Gender      │ ₹800            │ ₹350            │
│ Centres Outside India       │ ₹4500           │ ₹1800           │
└─────────────────────────────┴─────────────────┴─────────────────┘

📝 EXAM PATTERN:
• Mode: Computer Based Test (CBT)
• Medium: 13 Languages (Assamese, Bengali, English, Gujarati, Hindi, Kannada, Malayalam, Marathi, Punjabi, Odia, Tamil, Telugu, Urdu)
• Maximum Subjects: 5 (including languages and GAT)
• Questions per Paper: 50 (All Compulsory)
• Duration: 60 minutes per paper
• Marking: +5 for correct, -1 for incorrect (Negative Marking)

📚 SUBJECTS OFFERED (Total: 37):

LANGUAGES (13):
101-English, 102-Hindi, 103-Assamese, 104-Bengali, 105-Gujarati, 106-Kannada, 107-Malayalam, 108-Marathi, 109-Odia, 110-Punjabi, 111-Tamil, 112-Telugu, 113-Urdu

DOMAIN SUBJECTS (23):
301-Accountancy/Book Keeping, 302-Agriculture, 303-Anthropology, 304-Biology/Biotechnology/Biochemistry, 305-Business Studies, 306-Chemistry, 307-Environmental Science, 308-Computer Science/Information Practices, 309-Economics/Business Economics, 312-Fine Arts/Visual Arts, 313-Geography/Geology, 314-History, 315-Home Science, 316-Knowledge Tradition-Practices in India, 318-Mass Media/Mass Communication, 319-Mathematics/Applied Mathematics, 320-Performing Arts, 321-Physical Education/Yoga/Sports, 322-Physics, 323-Political Science, 324-Psychology, 325-Sanskrit, 326-Sociology

GENERAL TEST:
501-General Aptitude Test (GK, Current Affairs, Mental Ability, Numerical Ability, Quantitative Reasoning, Logical & Analytical Reasoning)

📖 SYLLABUS:
• Language Subjects: Reading Comprehension (Factual, Literary, Narrative passages), Literary Aptitude, Vocabulary
• Domain Subjects: As per NCERT Class 12 Syllabus
• General Aptitude Test: GK, Current Affairs, Mental Ability, Numerical Ability, Logical Reasoning

🏛️ 48 CENTRAL UNIVERSITIES:
Aligarh Muslim University, Assam University Silchar, Babasaheb Bhimrao Ambedkar University, Banaras Hindu University, Central Sanskrit University, Central Tribal University of Andhra Pradesh, Central University of Andhra Pradesh, Central University of Gujarat, Central University of Haryana, Central University of Himachal Pradesh, Central University of Jammu, Central University of Jharkhand, Central University of Karnataka, Central University of Kashmir, Central University of Kerala, Central University of Odisha, Central University of Punjab, Central University of Rajasthan, Central University of South Bihar, Central University of Tamil Nadu, Dr. Harisingh Gour Vishwavidyalaya, Guru Ghasidas Vishwavidyalaya, Hemvati Nandan Bahuguna Garhwal University, Indira Gandhi National Tribal University, Jamia Millia Islamia, Jawaharlal Nehru University, Mahatma Gandhi Antarrashtriya Hindi Vishwavidyalaya, Mahatma Gandhi Central University, Manipur University, Maulana Azad National Urdu University, Mizoram University, Nagaland University, National Sanskrit University, North-Eastern Hill University, Pondicherry University, Rajiv Gandhi National Aviation University, Rajiv Gandhi University Arunachal Pradesh, Shri Lal Bahadur Shastri National Sanskrit University, Sikkim University, Sammakka Sarakka Central Tribal University, South Asian University, Tezpur University, The English and Foreign Languages University, Tripura University, University of Allahabad, University of Delhi, University of Hyderabad, Visva-Bharati University

📞 NTA HELPDESK:
• Email: cuet-ug@nta.ac.in
• Phone: 011-40759000 / 011-69227700
`;
}

// Build course database summary
function buildDataSummary() {
  if (!cuetData) return '';
  
  const meta = cuetData.metadata;
  const universities = [...new Set(cuetData.universities.map(u => u.university_name))];
  const categories = [...new Set(cuetData.universities.map(u => u.course_category).filter(Boolean))];
  
  return `
═══════════════════════════════════════════════════════════════
CUET 2025 COURSE DATABASE
═══════════════════════════════════════════════════════════════
• Total Courses: ${meta.total_courses}
• Total Central Universities: ${meta.total_universities}
• Data Updated: ${meta.date_updated}
• Course Categories: ${categories.join(', ')}
`;
}

// Search function to find relevant courses
function searchCourses(query) {
  if (!cuetData) return [];
  
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);
  
  return cuetData.universities.filter(course => {
    const searchText = `${course.university_name} ${course.university_short} ${course.course_name} ${course.course_category} ${course.location} ${course.stream_12th}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  }).slice(0, 40);
}

// Format courses for AI context
function formatCoursesForContext(courses) {
  if (courses.length === 0) return 'No matching courses found in database.';
  
  return courses.map(c => 
    `• ${c.course_name} at ${c.university_name} (${c.university_short}), ${c.location}
  Category: ${c.course_category} | 12th Stream: ${c.stream_12th}
  CUET Language: ${c.cuet_language_req}
  CUET Domain Subjects: ${c.cuet_domain_subjects_req}
  General Test Required: ${c.cuet_general_test_req}
  Eligibility: ${c.comments}`
  ).join('\n\n');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Search for relevant courses based on user query
    const relevantCourses = searchCourses(message);
    const coursesContext = formatCoursesForContext(relevantCourses);
    const bulletinInfo = buildBulletinSummary();
    const dataSummary = buildDataSummary();

    const systemPrompt = `You are Jarmana, an AI assistant created by Nudge Academy, specializing in CUET UG (Common University Entrance Test for Undergraduate programs) guidance.

${bulletinInfo}

${dataSummary}

RELEVANT COURSES FOR THIS QUERY:
${coursesContext}

YOUR ROLE:
- Help students with CUET UG 2026 preparation, exam patterns, subject choices, and university admissions
- Provide accurate information about important dates, fees, exam pattern from the official bulletin
- Give details about courses, eligibility, and CUET requirements from the course database
- Guide on subject-wise preparation tips based on NCERT syllabus
- Help students choose the right subjects and universities based on their interests

RESPONSE GUIDELINES:
1. Always be encouraging, supportive, and student-friendly
2. Use the official bulletin data for dates, fees, exam pattern, subjects
3. Use the course database for university-specific course requirements
4. When asked about exam dates, fees, or pattern - cite the official NTA bulletin
5. When asked about specific courses - provide details from the database
6. If information is not available, say so clearly
7. For non-CUET questions, politely redirect: "I'm Jarmana, your CUET expert! I specialize in CUET UG 2026 preparation and admissions. How can I help you with CUET?"
8. Keep responses concise but informative
9. Use bullet points and formatting for better readability
10. Always encourage students and boost their confidence!

IMPORTANT: You have access to:
✅ Official CUET UG 2026 Information Bulletin (NTA)
✅ Course database with ${cuetData?.metadata?.total_courses || 1018} courses from ${cuetData?.metadata?.total_universities || 48} Central Universities`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
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
      return res.status(500).json({ error: data.error.message || 'API request failed' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
