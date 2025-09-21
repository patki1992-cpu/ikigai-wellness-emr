import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("provider"),
  specialization: varchar("specialization"),
  licenseNumber: varchar("license_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const genderEnum = pgEnum("gender", ["male", "female", "other", "not_specified"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "completed", "cancelled", "no_show"]);
export const labStatusEnum = pgEnum("lab_status", ["normal", "abnormal", "critical", "pending"]);
export const medicationStatusEnum = pgEnum("medication_status", ["active", "discontinued", "completed"]);
export const allergyTypeEnum = pgEnum("allergy_type", ["drug", "food", "environmental", "other"]);
export const severityEnum = pgEnum("severity", ["mild", "moderate", "severe"]);

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mrn: varchar("mrn").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  ssn: varchar("ssn"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactRelation: varchar("emergency_contact_relation"),
  bloodType: varchar("blood_type"),
  height: decimal("height", { precision: 5, scale: 2 }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  providerId: varchar("provider_id").references(() => users.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(30),
  appointmentType: varchar("appointment_type").notNull(),
  reason: text("reason"),
  status: appointmentStatusEnum("status").default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Medical records table
export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  providerId: varchar("provider_id").references(() => users.id).notNull(),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  visitDate: timestamp("visit_date").notNull(),
  chiefComplaint: text("chief_complaint"),
  historyOfPresentIllness: text("history_of_present_illness"),
  physicalExam: text("physical_exam"),
  assessment: text("assessment"),
  plan: text("plan"),
  diagnosis: text("diagnosis").array(),
  vitalSigns: jsonb("vital_signs"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lab results table
export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  providerId: varchar("provider_id").references(() => users.id).notNull(),
  testName: varchar("test_name").notNull(),
  testCode: varchar("test_code"),
  result: varchar("result"),
  normalRange: varchar("normal_range"),
  units: varchar("units"),
  status: labStatusEnum("status").default("pending"),
  orderDate: timestamp("order_date").notNull(),
  resultDate: timestamp("result_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Radiology table
export const radiologyResults = pgTable("radiology_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  providerId: varchar("provider_id").references(() => users.id).notNull(),
  studyType: varchar("study_type").notNull(),
  bodyPart: varchar("body_part"),
  findings: text("findings"),
  impression: text("impression"),
  recommendation: text("recommendation"),
  studyDate: timestamp("study_date").notNull(),
  radiologistId: varchar("radiologist_id").references(() => users.id),
  imageUrl: varchar("image_url"),
  reportUrl: varchar("report_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medications table
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  providerId: varchar("provider_id").references(() => users.id).notNull(),
  medicationName: varchar("medication_name").notNull(),
  dosage: varchar("dosage").notNull(),
  frequency: varchar("frequency").notNull(),
  route: varchar("route"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: medicationStatusEnum("status").default("active"),
  instructions: text("instructions"),
  refills: integer("refills"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Allergies table
export const allergies = pgTable("allergies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  allergen: varchar("allergen").notNull(),
  allergyType: allergyTypeEnum("allergy_type").notNull(),
  severity: severityEnum("severity").notNull(),
  reaction: text("reaction"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Preventive care table
export const preventiveCare = pgTable("preventive_care", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  careType: varchar("care_type").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  status: varchar("status").default("due"),
  providerId: varchar("provider_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Diet plans table
export const dietPlans = pgTable("diet_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  providerId: varchar("provider_id").references(() => users.id).notNull(),
  planName: varchar("plan_name").notNull(),
  description: text("description"),
  dailyCalories: integer("daily_calories"),
  dailyProtein: decimal("daily_protein", { precision: 6, scale: 2 }),
  dailyCarbs: decimal("daily_carbs", { precision: 6, scale: 2 }),
  dailyFat: decimal("daily_fat", { precision: 6, scale: 2 }),
  restrictions: text("restrictions").array(),
  goals: text("goals").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meal entries table
export const mealEntries = pgTable("meal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dietPlanId: varchar("diet_plan_id").references(() => dietPlans.id).notNull(),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  mealType: varchar("meal_type").notNull(),
  foodItem: varchar("food_item").notNull(),
  quantity: varchar("quantity"),
  calories: integer("calories"),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fat: decimal("fat", { precision: 6, scale: 2 }),
  loggedDate: date("logged_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  medicalRecords: many(medicalRecords),
  labResults: many(labResults),
  radiologyResults: many(radiologyResults),
  medications: many(medications),
  dietPlans: many(dietPlans),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  medicalRecords: many(medicalRecords),
  labResults: many(labResults),
  radiologyResults: many(radiologyResults),
  medications: many(medications),
  allergies: many(allergies),
  preventiveCare: many(preventiveCare),
  dietPlans: many(dietPlans),
  mealEntries: many(mealEntries),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [appointments.providerId],
    references: [users.id],
  }),
  medicalRecords: many(medicalRecords),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalRecords.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [medicalRecords.providerId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [medicalRecords.appointmentId],
    references: [appointments.id],
  }),
}));

export const labResultsRelations = relations(labResults, ({ one }) => ({
  patient: one(patients, {
    fields: [labResults.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [labResults.providerId],
    references: [users.id],
  }),
}));

export const radiologyResultsRelations = relations(radiologyResults, ({ one }) => ({
  patient: one(patients, {
    fields: [radiologyResults.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [radiologyResults.providerId],
    references: [users.id],
  }),
  radiologist: one(users, {
    fields: [radiologyResults.radiologistId],
    references: [users.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  patient: one(patients, {
    fields: [medications.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [medications.providerId],
    references: [users.id],
  }),
}));

export const allergiesRelations = relations(allergies, ({ one }) => ({
  patient: one(patients, {
    fields: [allergies.patientId],
    references: [patients.id],
  }),
}));

export const preventiveCareRelations = relations(preventiveCare, ({ one }) => ({
  patient: one(patients, {
    fields: [preventiveCare.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [preventiveCare.providerId],
    references: [users.id],
  }),
}));

export const dietPlansRelations = relations(dietPlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [dietPlans.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [dietPlans.providerId],
    references: [users.id],
  }),
  mealEntries: many(mealEntries),
}));

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  dietPlan: one(dietPlans, {
    fields: [mealEntries.dietPlanId],
    references: [dietPlans.id],
  }),
  patient: one(patients, {
    fields: [mealEntries.patientId],
    references: [patients.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  mrn: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLabResultSchema = createInsertSchema(labResults).omit({
  id: true,
  createdAt: true,
});

export const insertRadiologyResultSchema = createInsertSchema(radiologyResults).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAllergySchema = createInsertSchema(allergies).omit({
  id: true,
  createdAt: true,
});

export const insertPreventiveCareSchema = createInsertSchema(preventiveCare).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDietPlanSchema = createInsertSchema(dietPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMealEntrySchema = createInsertSchema(mealEntries).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;

export type RadiologyResult = typeof radiologyResults.$inferSelect;
export type InsertRadiologyResult = z.infer<typeof insertRadiologyResultSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = z.infer<typeof insertAllergySchema>;

export type PreventiveCare = typeof preventiveCare.$inferSelect;
export type InsertPreventiveCare = z.infer<typeof insertPreventiveCareSchema>;

export type DietPlan = typeof dietPlans.$inferSelect;
export type InsertDietPlan = z.infer<typeof insertDietPlanSchema>;

export type MealEntry = typeof mealEntries.$inferSelect;
export type InsertMealEntry = z.infer<typeof insertMealEntrySchema>;
