import mongoose from "mongoose";

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

const weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const exerciseIdPattern = /^(A1|A2|A3|B1|B2|C1|C2)_[1-9][0-9]*_[1-9][0-9]*$/;
const lessonIdPattern = /^(A1|A2|A3|B1|B2|C1|C2)_[1-9][0-9]*_[1-9][0-9]*$/;

const dailyTimeSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
      required: true,
    },
    seconds: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
    },
  },
  { _id: false },
);

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The target language this weekly progress belongs to.
    language: {
      type: String,
      enum: supportedLanguages,
      required: true,
    },
    // Total practice time in this week, measured in seconds.
    totalTime: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
    },
    // One entry per practiced day. A missing day has zero practice time.
    dailyTime: {
      type: [dailyTimeSchema],
      default: () => weekDays.map((day) => ({ day, seconds: 0 })),
      validate: {
        validator: (days) => {
          const uniqueDays = new Set(days.map((day) => day.day));
          return uniqueDays.size === days.length;
        },
        message: "dailyTime cannot contain duplicate days",
      },
    },
    // Calendar dates on which the learner practiced for at least 180 seconds.
    streakDate: {
      type: [Date],
      default: () => [],
    },
    // Number of streak-qualified days in this week.
    streak: {
      type: Number,
      min: 0,
      max: 7,
      required: true,
      default: 0,
    },
    // Completed exercise IDs, for example A1_1_1 (level_unit_exercise).
    completedLesson: {
      type: [String],
      default: () => [],
      validate: {
        validator: (lessons) => lessons.every((lesson) => lessonIdPattern.test(lesson)),
        message: "completedLesson must use the level_unit format",
      },
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
      default: 0,
    },
    // Last visited exercise, for example A1_1_1.
    lastExercise: {
      type: String,
      match: [exerciseIdPattern, "lastExercise must use the level_exercise format"],
      default: null,
    },
    weekStart: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, language: 1, weekStart: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
