const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume-builder';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    jobTitle: String,
  },
  summary: String,
  experience: [{
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    description: String,
    bullets: [String]
  }],
  education: [{
    school: String,
    degree: String,
    year: String
  }],
  skills: [String],
  templateId: { type: String, default: 'modern' },
  updatedAt: { type: Date, default: Date.now }
});

const Resume = mongoose.model('Resume', ResumeSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.send('AI Resume Builder API is running');
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resumes', authenticateToken, async (req, res) => {
  try {
    const resume = new Resume({ ...req.body, userId: req.user.id });
    await resume.save();
    res.status(201).json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/resumes', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resumes/:id', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        res.json(resume);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/resumes/public/:id', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        res.json(resume);
    } catch (err) {
        res.status(500).json({ error: 'Invalid resume link' });
    }
});

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/ai/generate-summary', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, skills, experience } = req.body;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        const mockSummary = `Accomplished ${jobTitle || 'Professional'} with expertise in ${skills ? skills.slice(0,3).join(', ') : 'industry-standard technologies'}. Proven track record of delivering high-impact solutions and driving operational excellence in fast-paced environments.`;
        return res.json({ summary: mockSummary, simulated: true });
    }
    const prompt = `Write a professional 2-3 sentence resume summary for a ${jobTitle}. Core skills: ${skills ? skills.join(', ') : 'not specified'}. Experience: ${experience ? JSON.stringify(experience) : 'not specified'}. Tone: Professional, result-oriented.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });
    const summary = completion.choices[0].message.content.trim();
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate summary with AI' });
  }
});

app.post('/api/ai/optimize-bullets', authenticateToken, async (req, res) => {
  try {
    const { bullets } = req.body;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        const mockOptimized = bullets.map(b => `🚀 Optimized: ${b} - Improved performance and efficiency by 25% using industry best practices.`);
        return res.json({ optimizedBullets: mockOptimized, simulated: true });
    }
    const prompt = `Optimize the following resume bullet points to be more impactful and result-oriented. Use action verbs and quantify achievements where possible. Bullets: ${bullets.join('\n')}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    const optimizedContent = completion.choices[0].message.content.trim();
    const optimizedBullets = optimizedContent.split('\n').map(b => b.replace(/^[•-]\s*/, '').trim());
    res.json({ optimizedBullets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize bullets with AI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
