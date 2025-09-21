import {
  users,
  patients,
  appointments,
  medicalRecords,
  labResults,
  radiologyResults,
  medications,
  allergies,
  preventiveCare,
  dietPlans,
  mealEntries,
  type User,
  type UpsertUser,
  type Patient,
  type InsertPatient,
  type Appointment,
  type InsertAppointment,
  type MedicalRecord,
  type InsertMedicalRecord,
  type LabResult,
  type InsertLabResult,
  type RadiologyResult,
  type InsertRadiologyResult,
  type Medication,
  type InsertMedication,
  type Allergy,
  type InsertAllergy,
  type PreventiveCare,
  type InsertPreventiveCare,
  type DietPlan,
  type InsertDietPlan,
  type MealEntry,
  type InsertMealEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Patient operations
  getPatients(search?: string, limit?: number, offset?: number): Promise<{ patients: Patient[]; total: number }>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByMRN(mrn: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient>;

  // Appointment operations
  getAppointments(providerId?: string, date?: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getPatientAppointments(patientId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;

  // Medical record operations
  getMedicalRecords(patientId: string): Promise<MedicalRecord[]>;
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: string, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord>;

  // Lab result operations
  getLabResults(patientId: string): Promise<LabResult[]>;
  getLabResult(id: string): Promise<LabResult | undefined>;
  getRecentLabResults(limit?: number): Promise<LabResult[]>;
  createLabResult(result: InsertLabResult): Promise<LabResult>;
  updateLabResult(id: string, result: Partial<InsertLabResult>): Promise<LabResult>;

  // Radiology operations
  getRadiologyResults(patientId: string): Promise<RadiologyResult[]>;
  getRadiologyResult(id: string): Promise<RadiologyResult | undefined>;
  createRadiologyResult(result: InsertRadiologyResult): Promise<RadiologyResult>;
  updateRadiologyResult(id: string, result: Partial<InsertRadiologyResult>): Promise<RadiologyResult>;

  // Medication operations
  getMedications(patientId: string): Promise<Medication[]>;
  getMedication(id: string): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication>;

  // Allergy operations
  getAllergies(patientId: string): Promise<Allergy[]>;
  createAllergy(allergy: InsertAllergy): Promise<Allergy>;
  deleteAllergy(id: string): Promise<void>;

  // Preventive care operations
  getPreventiveCare(patientId?: string): Promise<PreventiveCare[]>;
  getOverduePreventiveCare(): Promise<PreventiveCare[]>;
  createPreventiveCare(care: InsertPreventiveCare): Promise<PreventiveCare>;
  updatePreventiveCare(id: string, care: Partial<InsertPreventiveCare>): Promise<PreventiveCare>;

  // Diet plan operations
  getDietPlans(patientId: string): Promise<DietPlan[]>;
  getDietPlan(id: string): Promise<DietPlan | undefined>;
  createDietPlan(plan: InsertDietPlan): Promise<DietPlan>;
  updateDietPlan(id: string, plan: Partial<InsertDietPlan>): Promise<DietPlan>;

  // Meal entry operations
  getMealEntries(dietPlanId: string, date?: string): Promise<MealEntry[]>;
  createMealEntry(entry: InsertMealEntry): Promise<MealEntry>;
  updateMealEntry(id: string, entry: Partial<InsertMealEntry>): Promise<MealEntry>;
  deleteMealEntry(id: string): Promise<void>;

  // Dashboard stats
  getDashboardStats(providerId?: string): Promise<{
    totalPatients: number;
    todayAppointments: number;
    pendingResults: number;
    overdueScreenings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Patient operations
  async getPatients(search?: string, limit = 50, offset = 0): Promise<{ patients: Patient[]; total: number }> {
    let query = db.select().from(patients);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(patients);

    if (search) {
      const searchCondition = sql`${patients.firstName} ILIKE ${`%${search}%`} OR ${patients.lastName} ILIKE ${`%${search}%`} OR ${patients.mrn} ILIKE ${`%${search}%`}`;
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    const [patientsResult, [{ count }]] = await Promise.all([
      query.limit(limit).offset(offset).orderBy(asc(patients.lastName)),
      countQuery,
    ]);

    return { patients: patientsResult, total: count };
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByMRN(mrn: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.mrn, mrn));
    return patient;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    // Generate MRN
    const mrnPrefix = "MRN";
    const timestamp = Date.now().toString().slice(-6);
    const mrn = `${mrnPrefix}-${timestamp}`;

    const [newPatient] = await db
      .insert(patients)
      .values({ ...patient, mrn })
      .returning();
    return newPatient;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient> {
    const [updatedPatient] = await db
      .update(patients)
      .set({ ...patient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }

  // Appointment operations
  async getAppointments(providerId?: string, date?: string): Promise<Appointment[]> {
    let query = db.select().from(appointments);

    const conditions = [];
    if (providerId) conditions.push(eq(appointments.providerId, providerId));
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(
        and(
          sql`${appointments.appointmentDate} >= ${startDate}`,
          sql`${appointments.appointmentDate} < ${endDate}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(appointments.appointmentDate));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  // Medical record operations
  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    return await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.visitDate));
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
    return record;
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [newRecord] = await db
      .insert(medicalRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateMedicalRecord(id: string, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord> {
    const [updatedRecord] = await db
      .update(medicalRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Lab result operations
  async getLabResults(patientId: string): Promise<LabResult[]> {
    return await db
      .select()
      .from(labResults)
      .where(eq(labResults.patientId, patientId))
      .orderBy(desc(labResults.orderDate));
  }

  async getLabResult(id: string): Promise<LabResult | undefined> {
    const [result] = await db.select().from(labResults).where(eq(labResults.id, id));
    return result;
  }

  async getRecentLabResults(limit = 10): Promise<LabResult[]> {
    return await db
      .select()
      .from(labResults)
      .orderBy(desc(labResults.resultDate))
      .limit(limit);
  }

  async createLabResult(result: InsertLabResult): Promise<LabResult> {
    const [newResult] = await db
      .insert(labResults)
      .values(result)
      .returning();
    return newResult;
  }

  async updateLabResult(id: string, result: Partial<InsertLabResult>): Promise<LabResult> {
    const [updatedResult] = await db
      .update(labResults)
      .set(result)
      .where(eq(labResults.id, id))
      .returning();
    return updatedResult;
  }

  // Radiology operations
  async getRadiologyResults(patientId: string): Promise<RadiologyResult[]> {
    return await db
      .select()
      .from(radiologyResults)
      .where(eq(radiologyResults.patientId, patientId))
      .orderBy(desc(radiologyResults.studyDate));
  }

  async getRadiologyResult(id: string): Promise<RadiologyResult | undefined> {
    const [result] = await db.select().from(radiologyResults).where(eq(radiologyResults.id, id));
    return result;
  }

  async createRadiologyResult(result: InsertRadiologyResult): Promise<RadiologyResult> {
    const [newResult] = await db
      .insert(radiologyResults)
      .values(result)
      .returning();
    return newResult;
  }

  async updateRadiologyResult(id: string, result: Partial<InsertRadiologyResult>): Promise<RadiologyResult> {
    const [updatedResult] = await db
      .update(radiologyResults)
      .set(result)
      .where(eq(radiologyResults.id, id))
      .returning();
    return updatedResult;
  }

  // Medication operations
  async getMedications(patientId: string): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(eq(medications.patientId, patientId))
      .orderBy(desc(medications.startDate));
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db
      .insert(medications)
      .values(medication)
      .returning();
    return newMedication;
  }

  async updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication> {
    const [updatedMedication] = await db
      .update(medications)
      .set({ ...medication, updatedAt: new Date() })
      .where(eq(medications.id, id))
      .returning();
    return updatedMedication;
  }

  // Allergy operations
  async getAllergies(patientId: string): Promise<Allergy[]> {
    return await db
      .select()
      .from(allergies)
      .where(eq(allergies.patientId, patientId))
      .orderBy(asc(allergies.allergen));
  }

  async createAllergy(allergy: InsertAllergy): Promise<Allergy> {
    const [newAllergy] = await db
      .insert(allergies)
      .values(allergy)
      .returning();
    return newAllergy;
  }

  async deleteAllergy(id: string): Promise<void> {
    await db.delete(allergies).where(eq(allergies.id, id));
  }

  // Preventive care operations
  async getPreventiveCare(patientId?: string): Promise<PreventiveCare[]> {
    let query = db.select().from(preventiveCare);
    
    if (patientId) {
      query = query.where(eq(preventiveCare.patientId, patientId));
    }

    return await query.orderBy(asc(preventiveCare.dueDate));
  }

  async getOverduePreventiveCare(): Promise<PreventiveCare[]> {
    const today = new Date();
    return await db
      .select()
      .from(preventiveCare)
      .where(
        and(
          sql`${preventiveCare.dueDate} < ${today}`,
          eq(preventiveCare.status, "due")
        )
      )
      .orderBy(asc(preventiveCare.dueDate));
  }

  async createPreventiveCare(care: InsertPreventiveCare): Promise<PreventiveCare> {
    const [newCare] = await db
      .insert(preventiveCare)
      .values(care)
      .returning();
    return newCare;
  }

  async updatePreventiveCare(id: string, care: Partial<InsertPreventiveCare>): Promise<PreventiveCare> {
    const [updatedCare] = await db
      .update(preventiveCare)
      .set({ ...care, updatedAt: new Date() })
      .where(eq(preventiveCare.id, id))
      .returning();
    return updatedCare;
  }

  // Diet plan operations
  async getDietPlans(patientId: string): Promise<DietPlan[]> {
    return await db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.patientId, patientId))
      .orderBy(desc(dietPlans.createdAt));
  }

  async getDietPlan(id: string): Promise<DietPlan | undefined> {
    const [plan] = await db.select().from(dietPlans).where(eq(dietPlans.id, id));
    return plan;
  }

  async createDietPlan(plan: InsertDietPlan): Promise<DietPlan> {
    const [newPlan] = await db
      .insert(dietPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateDietPlan(id: string, plan: Partial<InsertDietPlan>): Promise<DietPlan> {
    const [updatedPlan] = await db
      .update(dietPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(dietPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // Meal entry operations
  async getMealEntries(dietPlanId: string, date?: string): Promise<MealEntry[]> {
    let query = db.select().from(mealEntries).where(eq(mealEntries.dietPlanId, dietPlanId));

    if (date) {
      query = query.where(
        and(
          eq(mealEntries.dietPlanId, dietPlanId),
          eq(mealEntries.loggedDate, date)
        )
      );
    }

    return await query.orderBy(desc(mealEntries.loggedDate));
  }

  async createMealEntry(entry: InsertMealEntry): Promise<MealEntry> {
    const [newEntry] = await db
      .insert(mealEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateMealEntry(id: string, entry: Partial<InsertMealEntry>): Promise<MealEntry> {
    const [updatedEntry] = await db
      .update(mealEntries)
      .set(entry)
      .where(eq(mealEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteMealEntry(id: string): Promise<void> {
    await db.delete(mealEntries).where(eq(mealEntries.id, id));
  }

  // Dashboard stats
  async getDashboardStats(providerId?: string): Promise<{
    totalPatients: number;
    todayAppointments: number;
    pendingResults: number;
    overdueScreenings: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [totalPatientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients);

    let todayAppointmentsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          sql`${appointments.appointmentDate} >= ${startOfDay}`,
          sql`${appointments.appointmentDate} <= ${endOfDay}`
        )
      );

    if (providerId) {
      todayAppointmentsQuery = todayAppointmentsQuery.where(
        and(
          eq(appointments.providerId, providerId),
          sql`${appointments.appointmentDate} >= ${startOfDay}`,
          sql`${appointments.appointmentDate} <= ${endOfDay}`
        )
      );
    }

    const [todayAppointmentsResult] = await todayAppointmentsQuery;

    const [pendingResultsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(labResults)
      .where(eq(labResults.status, "pending"));

    const [overdueScreeningsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(preventiveCare)
      .where(
        and(
          sql`${preventiveCare.dueDate} < ${today}`,
          eq(preventiveCare.status, "due")
        )
      );

    return {
      totalPatients: totalPatientsResult.count,
      todayAppointments: todayAppointmentsResult.count,
      pendingResults: pendingResultsResult.count,
      overdueScreenings: overdueScreeningsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
