import { query, validationResult } from "express-validator";

export const jobsListValidators = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("q").optional().isString().trim().isLength({ max: 200 }),
  query("minScore").optional().isInt({ min: 0, max: 100 }).toInt(),
];

export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: "Parâmetros inválidos",
      details: errors.array(),
    });
  }
  next();
}
