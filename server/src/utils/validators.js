const { z } = require('zod');

// Password Policy Rule: min 10 chars, uppercase, lowercase, number, special character
const passwordPolicy = z.string()
  .min(10, 'Password must be at least 10 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A-Z)')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a-z)')
  .regex(/[0-9]/, 'Password must contain at least one number (0-9)')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&* etc.)');

const loginSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(1)
});

const totpVerifySchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/, 'TOTP token must be exactly 6 digits')
});

const registerUserSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens'),
  email: z.string().trim().email('Invalid email address').max(100),
  password: passwordPolicy,
  full_name: z.string().trim().min(2).max(100),
  badge_number: z.string().trim().max(50).optional().nullable(),
  role: z.enum(['admin', 'investigator', 'reporter']).default('reporter')
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordPolicy
});

const incidentCreateSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum([
    'phishing',
    'social_media_impersonation',
    'account_compromise',
    'payment_fraud',
    'identity_theft',
    'suspicious_network_activity',
    'malware_incident',
    'other'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  reported_ip: z.string().trim().max(45).optional().nullable(),
  incident_date: z.string().trim().min(8).max(30)
});

const incidentUpdateSchema = z.object({
  title: z.string().trim().min(5).max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  category: z.enum([
    'phishing',
    'social_media_impersonation',
    'account_compromise',
    'payment_fraud',
    'identity_theft',
    'suspicious_network_activity',
    'malware_incident',
    'other'
  ]).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['Submitted', 'Under Review', 'Investigating', 'Resolved', 'Closed']).optional(),
  assigned_investigator_id: z.string().uuid().optional().nullable().or(z.string().optional().nullable()),
  reported_ip: z.string().trim().max(45).optional().nullable()
});

const investigationNoteSchema = z.object({
  note_type: z.enum(['observation', 'lead', 'action_taken', 'hypothesis', 'conclusion']),
  content: z.string().trim().min(3, 'Note must contain at least 3 characters').max(3000)
});

module.exports = {
  passwordPolicy,
  loginSchema,
  totpVerifySchema,
  registerUserSchema,
  updatePasswordSchema,
  incidentCreateSchema,
  incidentUpdateSchema,
  investigationNoteSchema
};
