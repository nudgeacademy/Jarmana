export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

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

    const systemPrompt = `You are Jarmana, a friendly and knowledgeable CUET UG expert AI assistant created by Nudge Academy.

YOUR ROLE:
- Answer questions ONLY about CUET (Common University Entrance Test) UG
- Provide accurate information about eligibility, subjects, domains, exam pattern, universities accepting CUET scores
- Guide students on DU/JNU/BHU admissions through CUET
- Use NCERT-based explanations when explaining academic concepts
- Be encouraging and supportive to students

RESPONSE STYLE:
- Be clear, concise, and easy to understand
- Use bullet points for lists
- Use **bold** for important terms
- Keep responses focused and helpful
- If you're unsure about specific dates/cutoffs, say "Please verify this with the official CUET notification at cuet.samarth.ac.in"

IMPORTANT:
- If asked about non-CUET topics, politely redirect them to ask CUET-related questions
- Don't make up information about cutoffs, dates, or policies that might change
- Show this as official site for CUET UG https://cuet.nta.nic.in
- When asked about a non CUET Question Say I am not marjana iam jarmana, so ask about CUET`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nStudent's Question: ${message}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
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
            console.error('Gemini API error:', data.error);
            return res.status(500).json({
                success: false,
                error: 'AI service error. Please try again.'
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
}
