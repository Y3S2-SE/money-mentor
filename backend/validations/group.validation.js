import { body } from "express-validator";

export const validateGroup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Group name is required")
    .isLength({ min: 3 })
    .withMessage("Group name must be at least 3 characters")
    .isLength({ max: 50 })
    .withMessage("Group name cannot exceed 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Description cannot exceed 250 characters"),

  body("inviteCode")
    .optional()
    .matches(/^[A-Z0-9]{6,10}$/)
    .withMessage("Invite code must be 6-10 uppercase alphanumeric characters"),

  body("admin")
    .notEmpty()
    .withMessage("Admin is required")
    .isMongoId()
    .withMessage("Admin must be a valid MongoDB ObjectId"),

  body("members")
    .optional()
    .isArray()
    .withMessage("Members must be an array"),

  body("members.*")
    .isMongoId()
    .withMessage("Each member must be a valid MongoDB ObjectId"),

  body("maxMembers")
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage("maxMembers must be a whole number between 1 and 15"),
];