import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertPatientSchema,
  insertAppointmentSchema,
  insertMedicalRecordSchema,
  insertLabResultSchema,
  insertRadiologyResultSchema,
  insertMedicationSchema,
  insertAllergySchema,
  insertPreventiveCareSchema,
  insertDietPlanSchema,
  insertMealEntrySchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For auth bypass, return the dev user directly
      if (process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production' && userId === 'dev-user') {
        return res.json({
          id: 'dev-user',
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null,
        });
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const stats = await storage.getDashboardStats(providerId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Patient routes
  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const { search, limit = "50", offset = "0" } = req.query;
      const result = await storage.getPatients(
        search as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const { date } = req.query;
      const appointments = await storage.getAppointments(providerId, date as string);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/patients/:patientId/appointments", isAuthenticated, async (req, res) => {
    try {
      const appointments = await storage.getPatientAppointments(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      res.status(500).json({ message: "Failed to fetch patient appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      
      // Parse appointmentDate string to Date object before validation
      const requestData = {
        ...req.body,
        providerId,
      };
      
      if (requestData.appointmentDate && typeof requestData.appointmentDate === 'string') {
        requestData.appointmentDate = new Date(requestData.appointmentDate);
      }
      
      const validatedData = insertAppointmentSchema.parse(requestData);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Medical record routes
  app.get("/api/patients/:patientId/medical-records", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getMedicalRecords(req.params.patientId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching medical records:", error);
      res.status(500).json({ message: "Failed to fetch medical records" });
    }
  });

  app.post("/api/medical-records", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const validatedData = insertMedicalRecordSchema.parse({
        ...req.body,
        providerId,
      });
      const record = await storage.createMedicalRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical record data", errors: error.errors });
      }
      console.error("Error creating medical record:", error);
      res.status(500).json({ message: "Failed to create medical record" });
    }
  });

  // Lab result routes
  app.get("/api/patients/:patientId/lab-results", isAuthenticated, async (req, res) => {
    try {
      const results = await storage.getLabResults(req.params.patientId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching lab results:", error);
      res.status(500).json({ message: "Failed to fetch lab results" });
    }
  });

  app.get("/api/lab-results/recent", isAuthenticated, async (req, res) => {
    try {
      const { limit = "10" } = req.query;
      const results = await storage.getRecentLabResults(parseInt(limit as string));
      res.json(results);
    } catch (error) {
      console.error("Error fetching recent lab results:", error);
      res.status(500).json({ message: "Failed to fetch recent lab results" });
    }
  });

  app.post("/api/lab-results", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const validatedData = insertLabResultSchema.parse({
        ...req.body,
        providerId,
      });
      const result = await storage.createLabResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lab result data", errors: error.errors });
      }
      console.error("Error creating lab result:", error);
      res.status(500).json({ message: "Failed to create lab result" });
    }
  });

  // Radiology routes
  app.get("/api/patients/:patientId/radiology-results", isAuthenticated, async (req, res) => {
    try {
      const results = await storage.getRadiologyResults(req.params.patientId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching radiology results:", error);
      res.status(500).json({ message: "Failed to fetch radiology results" });
    }
  });

  app.post("/api/radiology-results", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const validatedData = insertRadiologyResultSchema.parse({
        ...req.body,
        providerId,
      });
      const result = await storage.createRadiologyResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid radiology result data", errors: error.errors });
      }
      console.error("Error creating radiology result:", error);
      res.status(500).json({ message: "Failed to create radiology result" });
    }
  });

  // Medication routes
  app.get("/api/patients/:patientId/medications", isAuthenticated, async (req, res) => {
    try {
      const medications = await storage.getMedications(req.params.patientId);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const validatedData = insertMedicationSchema.parse({
        ...req.body,
        providerId,
      });
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medication data", errors: error.errors });
      }
      console.error("Error creating medication:", error);
      res.status(500).json({ message: "Failed to create medication" });
    }
  });

  // Allergy routes
  app.get("/api/patients/:patientId/allergies", isAuthenticated, async (req, res) => {
    try {
      const allergies = await storage.getAllergies(req.params.patientId);
      res.json(allergies);
    } catch (error) {
      console.error("Error fetching allergies:", error);
      res.status(500).json({ message: "Failed to fetch allergies" });
    }
  });

  app.post("/api/allergies", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAllergySchema.parse(req.body);
      const allergy = await storage.createAllergy(validatedData);
      res.status(201).json(allergy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid allergy data", errors: error.errors });
      }
      console.error("Error creating allergy:", error);
      res.status(500).json({ message: "Failed to create allergy" });
    }
  });

  // Preventive care routes
  app.get("/api/preventive-care", isAuthenticated, async (req, res) => {
    try {
      const { patientId } = req.query;
      const care = await storage.getPreventiveCare(patientId as string);
      res.json(care);
    } catch (error) {
      console.error("Error fetching preventive care:", error);
      res.status(500).json({ message: "Failed to fetch preventive care" });
    }
  });

  app.get("/api/preventive-care/overdue", isAuthenticated, async (req, res) => {
    try {
      const care = await storage.getOverduePreventiveCare();
      res.json(care);
    } catch (error) {
      console.error("Error fetching overdue preventive care:", error);
      res.status(500).json({ message: "Failed to fetch overdue preventive care" });
    }
  });

  app.post("/api/preventive-care", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const validatedData = insertPreventiveCareSchema.parse({
        ...req.body,
        providerId,
      });
      const care = await storage.createPreventiveCare(validatedData);
      res.status(201).json(care);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preventive care data", errors: error.errors });
      }
      console.error("Error creating preventive care:", error);
      res.status(500).json({ message: "Failed to create preventive care" });
    }
  });

  // Diet plan routes
  app.get("/api/patients/:patientId/diet-plans", isAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getDietPlans(req.params.patientId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching diet plans:", error);
      res.status(500).json({ message: "Failed to fetch diet plans" });
    }
  });

  app.post("/api/diet-plans", isAuthenticated, async (req: any, res) => {
    try {
      const providerId = req.user?.claims?.sub;
      const validatedData = insertDietPlanSchema.parse({
        ...req.body,
        providerId,
      });
      const plan = await storage.createDietPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid diet plan data", errors: error.errors });
      }
      console.error("Error creating diet plan:", error);
      res.status(500).json({ message: "Failed to create diet plan" });
    }
  });

  // Meal entry routes
  app.get("/api/diet-plans/:dietPlanId/meal-entries", isAuthenticated, async (req, res) => {
    try {
      const { date } = req.query;
      const entries = await storage.getMealEntries(req.params.dietPlanId, date as string);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching meal entries:", error);
      res.status(500).json({ message: "Failed to fetch meal entries" });
    }
  });

  app.post("/api/meal-entries", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMealEntrySchema.parse(req.body);
      const entry = await storage.createMealEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal entry data", errors: error.errors });
      }
      console.error("Error creating meal entry:", error);
      res.status(500).json({ message: "Failed to create meal entry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
