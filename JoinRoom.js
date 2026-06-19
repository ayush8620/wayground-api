// JoinRoom.js - NUGGET EDITION
// Returns room data + extracted questions

const CONFIG = {
  authCookie: "gswJMymmBJ36oIsPq0ValSHOjbUHaWbhXQs-F3HQoNvpLSO7NticF08rLCSegavz0eyNlaKjgFqzjC4ahER6I_w68fsjji8KUbeUnlrAfiu93tVChzs.sBT5g_cz5ihxLK1ZS8jk2g.LLCnDjlRAnx8mbYq",
  serverId: "6a3117e66999b60021f34789",
  socketId: "ASLh2qxdaxgBaXOcAcsl",
  apiUrl: "https://wayground.com/play-api/v5/join",
  ip: "171.61.172.211",
  mongoId: "69958e8e9ae9b62c39b5cda9",
  uid: "f7e57be9-83dc-4967-a0b9-e68288a5247a",
  userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36"
};

function generateBotName() {
  const names = ["Shadow", "Ghost", "Neon", "Viper", "Phoenix", "Cipher", "Raven", "Wolf", "Storm", "Blaze", "Nugget", "Hack", "Zero", "Omega", "Raptor"];
  return names[Math.floor(Math.random() * names.length)] + Math.random().toString(36).substring(2, 6);
}

function stripHtml(html) {
  if (!html) return "N/A";
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractQuestions(data) {
  const questions = data.room?.questions || data.questions || {};
  const questionIds = data.room?.questionIds || data.questionIds || [];
  
  // If room has rounds, extract from there too
  const rounds = data.room?.rounds || data.rounds || [];
  const roundQuestions = [];
  
  for (const round of rounds) {
    if (round.questions) {
      for (const q of round.questions) {
        roundQuestions.push(q);
      }
    }
  }

  const ids = questionIds.length > 0 ? questionIds : Object.keys(questions);
  
  const extracted = ids.map((qid, index) => {
    const q = questions[qid];
    if (!q) return null;

    const options = (q.structure?.options || q.options || []).map((opt, idx) => ({
      letter: String.fromCharCode(65 + idx),
      text: stripHtml(opt.text || opt),
      isCorrect: opt.isCorrect === true || opt.isCorrect === 1 || opt.correct === true
    }));

    return {
      id: qid,
      number: index + 1,
      type: q.type || q.structure?.type || "unknown",
      question: stripHtml(q.structure?.query?.text || q.query?.text || q.text || "N/A"),
      options: options,
      correctAnswer: options.find(o => o.isCorrect)?.letter || null,
      correctText: options.find(o => o.isCorrect)?.text || null,
      points: q.points || q.structure?.points || 0,
      timeLimit: q.timeLimit || q.structure?.timeLimit || 15,
      category: q.category || q.structure?.category || "General"
    };
  }).filter(Boolean);

  // If we got questions from rounds, add them
  for (const rq of roundQuestions) {
    const exists = extracted.find(e => e.id === rq.id || e.question === stripHtml(rq.text));
    if (!exists) {
      const options = (rq.options || []).map((opt, idx) => ({
        letter: String.fromCharCode(65 + idx),
        text: stripHtml(opt.text || opt),
        isCorrect: opt.isCorrect === true || opt.correct === true
      }));
      extracted.push({
        id: rq.id || `round_${extracted.length}`,
        number: extracted.length + 1,
        type: rq.type || "round",
        question: stripHtml(rq.text || rq.question || "N/A"),
        options: options,
        correctAnswer: options.find(o => o.isCorrect)?.letter || null,
        correctText: options.find(o => o.isCorrect)?.text || null,
        points: rq.points || 0,
        timeLimit: rq.timeLimit || 15,
        category: rq.category || "Round"
      });
    }
  }

  return extracted;
}

async function JoinRoom({ roomHash, name = "Bot", avatarId = null }) {
  const botName = name || generateBotName();
  const avatar = avatarId || Math.floor(Math.random() * 50) + 1;

  const payload = {
    roomHash,
    authCookie: CONFIG.authCookie,
    ip: CONFIG.ip,
    player: {
      id: botName,
      name: botName,
      origin: "web",
      isGoogleAuth: false,
      avatarId: avatar,
      expName: "main_main",
      expSlot: "6",
      mongoId: CONFIG.mongoId,
      uid: CONFIG.uid,
      startSource: "joinRoom",
      userAgent: CONFIG.userAgent
    },
    serverId: CONFIG.serverId,
    socketId: CONFIG.socketId + "_" + Math.random().toString(36).substring(2, 4),
    socketExperiment: "authRevamp",
    powerupInternalVersion: "20",
    soloApis: "v2",
    type: "live",
    "user-agent": CONFIG.userAgent,
    __cid__: "getHandshakeData.|1." + Date.now()
  };

  const response = await fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://wayground.com",
      Referer: "https://wayground.com/",
      Cookie: `auth=${CONFIG.authCookie}`,
      "User-Agent": CONFIG.userAgent
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Extract ALL questions from the response
  const questions = extractQuestions(data);

  return {
    success: true,
    room: {
      hash: roomHash,
      id: data.room?.id || data.id || null,
      name: data.room?.name || data.name || "Unknown Room",
      host: data.room?.host || data.host || null,
      maxPlayers: data.room?.maxPlayers || data.maxPlayers || 0,
      currentPlayers: data.room?.currentPlayers || data.currentPlayers || 0,
      status: data.room?.status || data.status || "unknown",
      roundCount: data.room?.roundCount || data.roundCount || 0
    },
    player: {
      id: data.player?.id || data.id || botName,
      name: botName,
      avatarId: avatar,
      token: data.token || data.player?.token || null,
      sessionId: data.sessionId || data.player?.sessionId || null
    },
    questions: {
      total: questions.length,
      list: questions
    },
    raw: data // Full raw response for debugging
  };
}

module.exports = JoinRoom;