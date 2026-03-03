const OpenAI = require('openai');
const ChatLog = require('../models/ChatLog');
const Appointment = require('../models/Appointment');
const Tenant = require('../models/Tenant');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { v4: uuidv4 } = require('crypto');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt builder for a specific tenant
const buildSystemPrompt = (tenant) => {
  const hours = Object.entries(tenant.workingHours)
    .filter(([_, v]) => v.isOpen)
    .map(([day, v]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${v.open} - ${v.close}`)
    .join(', ');

  return `You are a friendly, professional dental assistant AI for ${tenant.name} dental clinic.

CLINIC INFORMATION:
- Clinic Name: ${tenant.name}
- Location: ${tenant.address?.city || 'Contact us for address'}
- Working Hours: ${hours}
- Phone: ${tenant.phone || 'Please contact via booking system'}
- Language Support: English and Bangla

YOUR RESPONSIBILITIES:
1. Answer common dental health questions in a helpful, friendly manner
2. Provide general information about dental procedures and what to expect
3. Give post-treatment care advice for common procedures
4. Help patients understand symptoms and when to seek urgent care
5. Guide patients through the appointment booking process
6. Answer FAQ about the clinic's services and pricing
7. Provide first-aid advice for dental emergencies

IMPORTANT RULES (STRICTLY FOLLOW):
- ALWAYS include this disclaimer for medical queries: "⚠️ Disclaimer: This is general information only and NOT a medical diagnosis. Please consult with our dentist for proper evaluation."
- NEVER provide definitive diagnoses
- For serious symptoms (severe pain, swelling, difficulty breathing, trauma), ALWAYS recommend immediate professional care or emergency services
- Keep responses concise, warm, and professional
- If a patient wants to book an appointment, provide them with a booking link or suggest calling the clinic
- If asked about specific treatment costs, provide general ranges only and note prices vary

DENTAL KNOWLEDGE AREAS:
- Preventive care (brushing, flossing, fluoride)
- Common conditions (cavities, gum disease, sensitivity)
- Procedures (cleaning, filling, extraction, root canal, crowns, whitening, braces)
- Post-treatment care
- Dental emergencies
- Children's dental health
- Adult and senior dental care

Respond in the same language the patient uses (English or Bangla). Be empathetic and encouraging.`;
};

// @desc  Start or continue a chat session
// @route POST /api/v1/chat/message
// @access Public (tenant-specific)
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { message, sessionId, language = 'en' } = req.body;
  const tenantId = req.tenant?._id || req.user?.tenant;

  if (!message) return next(new ErrorResponse('Message is required', 400));
  if (!tenantId) return next(new ErrorResponse('Tenant context required', 400));

  const tenant = req.tenant || await Tenant.findById(tenantId);
  if (!tenant) return next(new ErrorResponse('Clinic not found', 404));

  // Get or create session
  const sid = sessionId || crypto.randomUUID?.() || Date.now().toString();

  let chatLog = await ChatLog.findOne({ tenant: tenantId, sessionId: sid });
  if (!chatLog) {
    chatLog = await ChatLog.create({
      tenant: tenantId,
      sessionId: sid,
      user: req.user?._id,
      language,
      messages: []
    });
  }

  // Build messages for OpenAI (keep last 10 for context)
  const history = chatLog.messages.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const messagesForAI = [
    { role: 'system', content: buildSystemPrompt(tenant) },
    ...history,
    { role: 'user', content: message }
  ];

  // Call OpenAI
  let aiResponse;
  let tokensUsed = 0;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForAI,
      max_tokens: 600,
      temperature: 0.7,
    });

    aiResponse = completion.choices[0].message.content;
    tokensUsed = completion.usage.total_tokens;
  } catch (err) {
    console.error('OpenAI error:', err);
    aiResponse = "I'm having trouble connecting right now. Please call the clinic directly or try again shortly. 😊";
  }

  // Save messages to log
  chatLog.messages.push({ role: 'user', content: message, tokens: 0 });
  chatLog.messages.push({ role: 'assistant', content: aiResponse, tokens: tokensUsed });
  chatLog.totalTokensUsed = (chatLog.totalTokensUsed || 0) + tokensUsed;
  await chatLog.save();

  // Check if user wants to book (intent detection)
  const bookingIntent = /book|appointment|schedule|reserve|slot|visit/i.test(message);

  res.status(200).json({
    success: true,
    data: {
      sessionId: sid,
      message: aiResponse,
      bookingIntent,
      bookingUrl: bookingIntent ? `/book/${tenant.subdomain}` : null
    }
  });
});

// @desc  Get chat history for a session
// @route GET /api/v1/chat/session/:sessionId
// @access Private
exports.getChatSession = asyncHandler(async (req, res, next) => {
  const chatLog = await ChatLog.findOne({
    tenant: req.user.tenant,
    sessionId: req.params.sessionId
  });

  if (!chatLog) return next(new ErrorResponse('Session not found', 404));
  res.status(200).json({ success: true, data: chatLog });
});

// @desc  Get all chat logs for tenant (admin)
// @route GET /api/v1/chat/logs
// @access Private (admin)
exports.getChatLogs = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const total = await ChatLog.countDocuments({ tenant: req.user.tenant });
  const logs = await ChatLog.find({ tenant: req.user.tenant })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({ success: true, total, data: logs });
});
