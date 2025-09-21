import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Calendar, 
  Activity, 
  Pill, 
  Apple,
  FileText,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle
} from "lucide-react";
import type { Patient, Appointment, MedicalRecord, LabResult, Medication, DietPlan } from "@shared/schema";

interface PatientModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientModal({ patient, isOpen, onClose }: PatientModalProps) {
  const [activeTab, setActiveTab] = useState("demographics");

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/patients", patient.id, "appointments"],
    enabled: isOpen,
  });

  const { data: medicalRecords, isLoading: recordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/patients", patient.id, "medical-records"],
    enabled: isOpen,
  });

  const { data: labResults, isLoading: labLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/patients", patient.id, "lab-results"],
    enabled: isOpen,
  });

  const { data: medications, isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/patients", patient.id, "medications"],
    enabled: isOpen,
  });

  const { data: dietPlans, isLoading: dietLoading } = useQuery<DietPlan[]>({
    queryKey: ["/api/patients", patient.id, "diet-plans"],
    enabled: isOpen,
  });

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" className="status-scheduled">Scheduled</Badge>;
      case "completed":
        return <Badge className="status-completed">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="status-cancelled">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLabStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return <Badge className="lab-normal">Normal</Badge>;
      case "abnormal":
        return <Badge className="lab-abnormal">Abnormal</Badge>;
      case "critical":
        return <Badge className="lab-critical">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid="modal-patient-details">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Patient Details</span>
            <Button variant="outline" onClick={onClose} data-testid="button-close-patient-modal">
              Close
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Patient Summary Header */}
        <div className="bg-accent rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials(patient.firstName, patient.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {patient.firstName} {patient.lastName}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">MRN</p>
                  <p className="font-medium font-mono" data-testid="text-patient-mrn">{patient.mrn}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DOB</p>
                  <p className="font-medium" data-testid="text-patient-dob">
                    {new Date(patient.dateOfBirth).toLocaleDateString()} ({getAge(patient.dateOfBirth)} years)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize" data-testid="text-patient-gender">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Type</p>
                  <p className="font-medium" data-testid="text-patient-blood-type">{patient.bloodType || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="demographics" data-testid="tab-demographics">Demographics</TabsTrigger>
            <TabsTrigger value="medical-history" data-testid="tab-medical-history">Medical History</TabsTrigger>
            <TabsTrigger value="lab-results" data-testid="tab-lab-results">Lab Results</TabsTrigger>
            <TabsTrigger value="medications" data-testid="tab-medications">Medications</TabsTrigger>
            <TabsTrigger value="diet-plan" data-testid="tab-diet-plan">Diet Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-patient-email">{patient.email || "—"}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-patient-phone">{patient.phone || "—"}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div data-testid="text-patient-address">{patient.address || "—"}</div>
                      {(patient.city || patient.state || patient.zipCode) && (
                        <div className="text-muted-foreground">
                          {patient.city}, {patient.state} {patient.zipCode}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Emergency Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium" data-testid="text-emergency-contact-name">
                      {patient.emergencyContactName || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-emergency-contact-relation">
                      {patient.emergencyContactRelation || "—"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-emergency-contact-phone">
                      {patient.emergencyContactPhone || "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Physical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Height</p>
                    <p className="font-medium" data-testid="text-patient-height">
                      {patient.height ? `${patient.height}"` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium" data-testid="text-patient-weight">
                      {patient.weight ? `${patient.weight} lbs` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">BMI</p>
                    <p className="font-medium" data-testid="text-patient-bmi">
                      {patient.height && patient.weight 
                        ? (703 * parseFloat(patient.weight) / (parseFloat(patient.height) ** 2)).toFixed(1)
                        : "—"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blood Type</p>
                    <p className="font-medium" data-testid="text-patient-blood-type-detail">
                      {patient.bloodType || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Medical Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recordsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start space-x-4 p-4">
                        <Skeleton className="w-3 h-3 rounded-full mt-2" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="w-20 h-4" />
                      </div>
                    ))}
                  </div>
                ) : medicalRecords && medicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords.map((record) => (
                      <div key={record.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg" data-testid={`medical-record-${record.id}`}>
                        <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-foreground">Visit Record</h6>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.visitDate).toLocaleDateString()}
                            </span>
                          </div>
                          {record.chiefComplaint && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Chief Complaint:</strong> {record.chiefComplaint}
                            </p>
                          )}
                          {record.assessment && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Assessment:</strong> {record.assessment}
                            </p>
                          )}
                          {record.plan && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Plan:</strong> {record.plan}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No medical records found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Recent Appointments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="w-20 h-6" />
                      </div>
                    ))}
                  </div>
                ) : appointments && appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-accent rounded-lg" data-testid={`appointment-${appointment.id}`}>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.appointmentType} - {appointment.reason}
                          </p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No appointments found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab-results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Laboratory Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {labLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="w-20 h-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : labResults && labResults.length > 0 ? (
                  <div className="space-y-3">
                    {labResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 bg-accent rounded-lg" data-testid={`lab-result-${result.id}`}>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{result.testName}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.resultDate ? new Date(result.resultDate).toLocaleDateString() : "Pending"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{result.result || "—"}</p>
                          <div className="mt-1">{getLabStatusBadge(result.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No lab results found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="w-5 h-5" />
                  <span>Current Medications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                  </div>
                ) : medications && medications.length > 0 ? (
                  <div className="space-y-3">
                    {medications.map((medication) => (
                      <div key={medication.id} className="p-3 bg-accent rounded-lg" data-testid={`medication-${medication.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{medication.medicationName}</p>
                            <p className="text-sm text-muted-foreground">
                              {medication.dosage} - {medication.frequency}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started: {new Date(medication.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                            {medication.status}
                          </Badge>
                        </div>
                        {medication.instructions && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong>Instructions:</strong> {medication.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No medications found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diet-plan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Apple className="w-5 h-5" />
                  <span>Active Diet Plans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dietLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 space-y-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dietPlans && dietPlans.length > 0 ? (
                  <div className="space-y-4">
                    {dietPlans.filter(plan => plan.isActive).map((plan) => (
                      <div key={plan.id} className="p-4 bg-accent rounded-lg" data-testid={`diet-plan-${plan.id}`}>
                        <h4 className="font-medium text-foreground mb-2">{plan.planName}</h4>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-medium text-foreground mb-2">Daily Targets</h6>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Calories</span>
                                <span className="text-foreground">{plan.dailyCalories || "—"} kcal</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Protein</span>
                                <span className="text-foreground">{plan.dailyProtein || "—"}g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Carbs</span>
                                <span className="text-foreground">{plan.dailyCarbs || "—"}g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fat</span>
                                <span className="text-foreground">{plan.dailyFat || "—"}g</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h6 className="font-medium text-foreground mb-2">Restrictions & Goals</h6>
                            <div className="space-y-2">
                              {plan.restrictions && plan.restrictions.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Restrictions:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {plan.restrictions.map((restriction, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {restriction}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {plan.goals && plan.goals.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Goals:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {plan.goals.map((goal, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {goal}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Apple className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active diet plans found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
