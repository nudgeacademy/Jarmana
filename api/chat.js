const cuetData = require('./cuet-data.json');
const nirfData = require('./nirf_rankings_2025.json');

// Keywords that indicate the user needs university/course data
const universityKeywords = ['university', 'universities', 'college', 'colleges', 'du', 'jnu', 'bhu', 'amu', 'jamia', 'allahabad', 'course', 'courses', 'admission', 'admissions', 'eligibility', 'seat', 'seats', 'cutoff', 'cut-off', 'campus'];
const courseKeywords = ['ba', 'bsc', 'bcom', 'bba', 'bca', 'llb', 'law', 'engineering', 'btech', 'b.tech', 'arts', 'science', 'commerce', 'humanities', 'economics', 'psychology', 'english', 'history', 'political', 'sociology', 'physics', 'chemistry', 'mathematics', 'maths', 'biology', 'computer'];

// Keywords that indicate user wants NIRF ranking info
const nirfKeywords = ['nirf', 'ranking', 'rankings', 'rank', 'ranked', 'best', 'top', 'good'];

// University name mappings for common abbreviations
const universityMappings = {
	'du': 'delhi university',
	'jnu': 'jawaharlal nehru',
	'bhu': 'banaras hindu',
	'amu': 'aligarh muslim',
	'jamia': 'jamia millia',
	'au': 'allahabad',
	'cu': 'central university',
	'nehu': 'north eastern hill',
	'bbau': 'babasaheb bhimrao ambedkar'
};

// Filter universities based on user query
function filterRelevantData(query, universities) {
	const lowerQuery = query.toLowerCase();

	// Check if the query needs university data at all
	const needsData = [...universityKeywords, ...courseKeywords, ...Object.keys(universityMappings)]
		.some(kw => lowerQuery.includes(kw));

	if (!needsData) {
		return null; // No university data needed for general CUET questions
	}

	// Expand abbreviations in query
	let expandedQuery = lowerQuery;
	for (const [abbr, full] of Object.entries(universityMappings)) {
		if (lowerQuery.includes(abbr)) {
			expandedQuery += ' ' + full;
		}
	}

	// Extract search terms
	const queryWords = expandedQuery.split(/\s+/).filter(w => w.length > 2);

	// Score and filter universities
	const scored = universities.map(uni => {
		let score = 0;
		const searchText = `${uni.university_name} ${uni.university_short} ${uni.location} ${uni.course_name} ${uni.course_category} ${uni.standard_course_name || ''}`.toLowerCase();

		for (const word of queryWords) {
			if (searchText.includes(word)) {
				score += word.length > 4 ? 2 : 1; // Longer matches score higher
			}
		}
		return { uni, score };
	});

	// Return top matches (max 30 to keep response fast)
	const relevant = scored
		.filter(s => s.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 30)
		.map(s => s.uni);

	return relevant.length > 0 ? relevant : null;
}

// Filter NIRF rankings based on user query
function filterNirfData(query, rankings) {
	const lowerQuery = query.toLowerCase();

	// Check if query is about rankings
	const wantsRankings = nirfKeywords.some(kw => lowerQuery.includes(kw));
	if (!wantsRankings) return null;

	// If asking for top N, extract the number
	const topMatch = lowerQuery.match(/top\s*(\d+)/i);
	const limit = topMatch ? Math.min(parseInt(topMatch[1]), 50) : 20;

	// Check for state/city filters
	const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
	let filtered = rankings;

	// Filter by location if mentioned
	const locationFiltered = rankings.filter(uni => {
		const searchText = `${uni.name} ${uni.city} ${uni.state}`.toLowerCase();
		return queryWords.some(word => searchText.includes(word) && word.length > 3);
	});

	if (locationFiltered.length > 0) {
		filtered = locationFiltered;
	}

	return filtered.slice(0, limit);
}

module.exports = async function handler(req, res) {
	// Only allow POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { message, history = [] } = req.body;

	// Validate input
	if (!message || typeof message !== 'string') {
		return res.status(400).json({ error: 'Message is required' });
	}

	if (message.length > 500) {
		return res.status(400).json({ error: 'Message too long (max 500 characters)' });
	}

	// API key is stored securely in environment variables
	const API_KEY = process.env.GEMINI_API_KEY;

	if (!API_KEY) {
		console.error('GEMINI_API_KEY not configured');
		return res.status(500).json({ error: 'Server configuration error' });
	}

	// Filter data based on user query - only include relevant universities/courses
	const relevantData = filterRelevantData(message, cuetData.universities);
	const universityData = relevantData ? JSON.stringify(relevantData) : null;

	// Filter NIRF data only when user asks about rankings
	const nirfRankings = nirfData?.categories?.overall?.rankings || [];
	const relevantNirf = filterNirfData(message, nirfRankings);
	const nirfDataStr = relevantNirf ? JSON.stringify(relevantNirf) : null;

	const systemInstruction = `You are nudge AI, a CUET UG expert by Nudge Academy.

ROLE: Answer ONLY CUET questions (eligibility, subjects, domains, exam pattern, DU/JNU/BHU admissions). Use NCERT-based explanations.

STYLE: Clear, concise. Use bullet points (- or *) for lists. Use **bold** for key terms (double asterisks only). NEVER use markdown headers (#). NEVER use single asterisks. Be helpful & encouraging. NEVER describe yourself as "friendly" or similar. Do NOT greet the user in every response - only provide a brief greeting in your very first response of a conversation, then get straight to answering questions.

NON-CUET: "I specialize in CUET questions. Ask about exams, eligibility, subjects, or admissions!"

---CUET UG 2026 DATA---

CONDUCTING: NTA | UG admissions to Central/Participating Universities | AY 2026-27

MODE: CBT | LANGUAGES: English, Hindi, Assamese, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu

DATES(Tentative): Apply 03-30 Jan 2026 | Fee by 31 Jan | Correction 02-04 Feb | Exam 11-31 May 2026 | Site: cuet.nta.nic.in

SUBJECTS: 37 total (13 Lang + 23 Domain + 1 GAT) | Max 5 allowed | Can differ from Class 12

PATTERN: 50 MCQs/paper | 60 min/paper | Multiple shifts
MARKING: +5 correct | -1 wrong | 0 unattempted | Dropped Q = +5 all

SYLLABUS: Lang=Reading Comprehension,Vocab,Literary Aptitude | Domain=NCERT Class 12 | GAT=GK,Current Affairs,Reasoning,Numerical,Quantitative,Analytical

FEES(≤3 subjects): UR ₹1000 | OBC-NCL/EWS ₹900 | SC/ST/PwD ₹800 | Outside India ₹4500
FEES(per extra): UR ₹400 | OBC-NCL/EWS ₹375 | SC/ST/PwD ₹350 | Outside India ₹1800

ELIGIBILITY: No age limit | Passed/Appearing Class 12 | University-specific requirements apply
BOARDS: CBSE/ISC/State/NIOS(5 subjects)/IB/Cambridge/GCE/AICTE diploma/Foreign(UGC equiv)

RESERVATION: SC, ST, OBC-NCL, EWS, PwD/PwBD (GoI norms)

PwD: Scribe allowed | +20 min/hour | UDID/Certificate required | False claims = cancellation

CITIES: Choose up to 4 | Same state as address | NTA may reassign

ADMIT CARD: Download from NTA | Carry: Admit Card + Photo ID + Photo + PwD cert(if applicable)
ALLOWED: Admit card, transparent pen, ID, diabetic food
BARRED: Mobiles, smartwatches, calculators, bags, books, electronics, heavy jewellery

DRESS: Light clothes | Slippers/sandals only | Religious dress = early frisking

ANSWER KEY: Provisional released online | Challenge ₹200/Q (non-refundable) | Final is binding

RESULT: Normalized scores | Valid 2026-27 only | No re-evaluation

ADMISSIONS: NTA conducts exam only | Universities handle counselling | Score ≠ guaranteed admission

UFM: Cheating/impersonation/prohibited items/multiple apps/tampering/hacking → Result cancel + 3yr debarment + criminal action

HELPDESK: cuet-ug@nta.ac.in | 011-40759000 | 011-69227700

---UNIVERSITY & COURSE DATABASE---
${universityData ? `Relevant courses for this query:\n${universityData}` : 'No specific university data needed for this question. Answer based on general CUET knowledge above.'}

---NIRF RANKINGS 2025---
${nirfDataStr ? `Relevant NIRF rankings:\n${nirfDataStr}` : 'No ranking data needed for this question.'}`;

	// Build conversation history for Gemini
	const contents = [];

	// Add previous messages from history
	for (const msg of history) {
		contents.push({
			role: msg.role,
			parts: [{ text: msg.content }]
		});
	}

	// Add current user message
	contents.push({
		role: 'user',
		parts: [{ text: message }]
	});

	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					systemInstruction: {
						parts: [{ text: systemInstruction }]
					},
					contents: contents,
					generationConfig: {
						temperature: 0.5,
						maxOutputTokens: 2048,
					}
				})
			}
		);

		const data = await response.json();

		if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
			return res.status(200).json({
				success: true,
				response: data.candidates[0].content.parts[0].text
			});
		} else if (data.error) {
			console.error('Gemini API error:', JSON.stringify(data.error, null, 2));
			return res.status(500).json({
				success: false,
				error: `AI service error: ${data.error.message || 'Please try again.'}`
			});
		} else {
			return res.status(500).json({
				success: false,
				error: 'Could not generate response. Please try again.'
			});
		}
	} catch (error) {
		console.error('Server error:', error);
		return res.status(500).json({
			success: false,
			error: 'Server error. Please try again later.'
		});
	}
};
