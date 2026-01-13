# Jarmana

🎓 AI-powered CUET expert chatbot by Nudge Academy

## 🚀 Quick Deploy to Vercel (FREE)

### Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (keep it secret!)

### Step 2: Deploy to Vercel

**Option A: One-Click Deploy (Easiest)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/jarmana)

**Option B: Manual Deploy**

1. Create a GitHub account (if you don't have one)
2. Create a new repository named `jarmana`
3. Upload all these files to the repository
4. Go to [vercel.com](https://vercel.com) and sign up with GitHub
5. Click "New Project" → Import your `jarmana` repo
6. **Important:** Before deploying, add your API key:
   - Go to "Environment Variables"
   - Add: `GEMINI_API_KEY` = `your_actual_api_key`
7. Click "Deploy"

### Step 3: Done! 🎉
Your site will be live at: `https://jarmana.vercel.app`

---

## 📁 Project Structure

```
jarmana/
├── index.html          # Frontend chat interface
├── api/
│   └── chat.js         # Serverless function (hides API key)
├── vercel.json         # Vercel configuration
├── NUDGE_LOGO.png      # Your logo (add this)
├── .env.example        # Environment variable template
└── README.md           # This file
```

---

## 🔒 Why This is Secure

- ❌ **Before:** API key was in HTML (visible to everyone)
- ✅ **Now:** API key is stored in Vercel's environment variables (hidden)
- The frontend calls `/api/chat` which runs on Vercel's servers
- Your API key never leaves the server

---

## 🛠️ Local Development

1. Install [Node.js](https://nodejs.org/)
2. Install Vercel CLI: `npm i -g vercel`
3. Clone this repo
4. Create `.env` file with your API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```
5. Run: `vercel dev`
6. Open: `http://localhost:3000`

---

## ⚙️ Customization

### Change Branding
Edit `index.html`:
- Logo: Replace `NUDGE_LOGO.png`
- Colors: Modify `--primary` in CSS
- Title: Change `<title>` and welcome text

### Modify AI Behavior
Edit `api/chat.js`:
- Change the `systemPrompt` to customize responses
- Adjust `temperature` (0-1) for creativity
- Modify `maxOutputTokens` for response length

---

## 📞 Support

- Website: [nudge.academy](https://www.nudge.academy)
- Built by Jamia • IIT • DU students

---

## 📄 License

MIT License - Feel free to use and modify!
