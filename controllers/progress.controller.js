import Progress from "../models/progress.model.js";

const supportedLanguages = [
  "de",
  "fr",
  "en",
  "es",
  "it",
  "pt",
  "ja",
  "ko",
  "zh",
  "ar",
];

const getWeekStart = () => {
  const today = new Date();
  const day = today.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  today.setUTCDate(today.getUTCDate() - daysFromMonday);
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

const getLanguage = (req) => {
  const language = req.query.language || req.body?.language || "de";
  return supportedLanguages.includes(language) ? language : null;
};

const serializeProgress = (progress) => ({
  id: progress._id.toString(),
  userId: progress.userId.toString(),
  language: progress.language,
  totalTime: progress.totalTime,
  dailyTime: progress.dailyTime,
  streakDate: progress.streakDate,
  streak: progress.streak,
  completedLesson: progress.completedLesson,
  accuracy: progress.accuracy,
  lastExercise: progress.lastExercise,
  weekStart: progress.weekStart,
});

export const getProgress = async (req, res) => {
  const language = getLanguage(req);
  if (!language) {
    return res.status(400).json({ message: "unsupported language" });
  }

  try {
    const weekStart = getWeekStart();
    const progress = await Progress.findOneAndUpdate(
      { userId: req.user.id, language, weekStart },
      { $setOnInsert: { userId: req.user.id, language, weekStart } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.json({
      message: "progress fetched successfully",
      progress: serializeProgress(progress),
    });
  } catch (err) {
    console.log("db error ", err);
    return res.status(500).json({ message: "database error" });
  }
};

export const updateProgress = async (req, res) => {
  const language = getLanguage(req);
  if (!language) {
    return res.status(400).json({ message: "unsupported language" });
  }

  const allowedFields = [
    "totalTime",
    "dailyTime",
    "streakDate",
    "streak",
    "completedLesson",
    "accuracy",
    "lastExercise",
  ];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "at least one field is required" });
  }

  try {
    const progress = await Progress.findOneAndUpdate(
      { userId: req.user.id, language, weekStart: getWeekStart() },
      { $set: updates, $setOnInsert: { userId: req.user.id, language, weekStart: getWeekStart() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    return res.json({
      message: "progress updated successfully",
      progress: serializeProgress(progress),
    });
  } catch (err) {
    console.log("db error ", err);
    return res.status(500).json({ message: "database error" });
  }
};
