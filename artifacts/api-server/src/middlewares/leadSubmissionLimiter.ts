import rateLimit from "express-rate-limit";

export const leadSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many quote requests were sent. Please try again later.",
  },
});
