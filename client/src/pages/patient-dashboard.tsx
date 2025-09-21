import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Calendar, 
  FileText, 
  Activity,
  Pill,
  Shield,
  Heart,
  Apple
} from "lucide-react";

interface PatientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
  };
}

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentType: string;
  status: string;
  reason: string | null;
}

interface LabResult {
  id: string;
  testName: string;
  result: string;
  status: string;
  resultDate: string | null;
  normalRange: string;
  units: string;
}

interface Medication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: string;
  startDate: string;
  endDate: string | null;
}

export default function PatientDashboard() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<PatientUser>({
    queryKey: ['/api/patient/auth/user'],
    retry: false,
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/patient/appointments'],
    enabled: !!user,
  });

  const { data: labResults, isLoading: labLoading } = useQuery<LabResult[]>({
    queryKey: ['/api/patient/lab-results'],
    enabled: !!user,
  });

  const { data: medications, isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ['/api/patient/medications'],
    enabled: !!user,
  });

  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Access Denied",
        description: "Patient access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
    }
  }, [user, userLoading, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" data-testid={`status-${status}`}>Scheduled</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-success text-success-foreground" data-testid={`status-${status}`}>Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" data-testid={`status-${status}`}>Cancelled</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const getLabStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return <Badge className="bg-success text-success-foreground" data-testid={`lab-status-${status}`}>Normal</Badge>;
      case "abnormal":
        return <Badge variant="destructive" data-testid={`lab-status-${status}`}>Abnormal</Badge>;
      case "critical":
        return <Badge variant="destructive" data-testid={`lab-status-${status}`}>Critical</Badge>;
      case "pending":
        return <Badge variant="outline" data-testid={`lab-status-${status}`}>Pending</Badge>;
      default:
        return <Badge variant="outline" data-testid={`lab-status-${status}`}>{status}</Badge>;
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Ikigai Wellness</h1>
                <p className="text-sm text-muted-foreground">Patient Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground" data-testid="text-patient-name">
                  {user.patient ? `${user.patient.firstName} ${user.patient.lastName}` : `${user.firstName} ${user.lastName}`}
                </p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back, {user.patient?.firstName || user.firstName}!
          </h2>
          <p className="text-muted-foreground">
            Access your medical information and track your health journey.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-upcoming-appointments">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-muted-foreground text-sm">Upcoming Appointments</p>
                  {appointmentsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground" data-testid="text-upcoming-appointments">
                      {appointments?.filter(apt => apt.status === 'scheduled').length || 0}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-lab-results">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-muted-foreground text-sm">Lab Results</p>
                  {labLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground" data-testid="text-lab-results">
                      {labResults?.length || 0}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-medications">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Pill className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-muted-foreground text-sm">Active Medications</p>
                  {medicationsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground" data-testid="text-active-medications">
                      {medications?.filter(med => med.status === 'active').length || 0}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-health-status">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-muted-foreground text-sm">Health Status</p>
                  <p className="text-2xl font-semibold text-success" data-testid="text-health-status">
                    Good
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <Card data-testid="card-recent-appointments">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : appointments && appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {appointment.appointmentType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </p>
                        {appointment.reason && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.reason}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No appointments found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Lab Results */}
          <Card data-testid="card-recent-lab-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Lab Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {labLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : labResults && labResults.length > 0 ? (
                <div className="space-y-4">
                  {labResults.slice(0, 3).map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                      data-testid={`lab-result-${result.id}`}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {result.testName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {result.result} {result.units}
                        </p>
                        {result.normalRange && (
                          <p className="text-xs text-muted-foreground">
                            Normal: {result.normalRange}
                          </p>
                        )}
                        {result.resultDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.resultDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {getLabStatusBadge(result.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No lab results found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Medications */}
        <Card className="mt-8" data-testid="card-current-medications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : medications && medications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications
                  .filter(med => med.status === 'active')
                  .map((medication) => (
                    <div
                      key={medication.id}
                      className="p-4 border border-border rounded-lg"
                      data-testid={`medication-${medication.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {medication.medicationName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {medication.dosage} - {medication.frequency}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Started: {new Date(medication.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active medications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}