import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  FileText,
  Activity
} from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingResults: number;
  overdueScreenings: number;
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  appointmentType: string;
  reason: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
}

interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  status: "normal" | "abnormal" | "critical" | "pending";
  resultDate: string | null;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: recentLabResults, isLoading: labResultsLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/lab-results/recent"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Provider Dashboard" subtitle="Welcome back to Ikigai Wellness" />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-patients">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-muted-foreground text-sm">Total Patients</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-semibold text-foreground" data-testid="text-total-patients">
                        {stats?.totalPatients || 0}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-today-appointments">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-muted-foreground text-sm">Today's Appointments</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-semibold text-foreground" data-testid="text-today-appointments">
                        {stats?.todayAppointments || 0}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-results">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-warning" />
                  </div>
                  <div className="ml-4">
                    <p className="text-muted-foreground text-sm">Pending Results</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-semibold text-foreground" data-testid="text-pending-results">
                        {stats?.pendingResults || 0}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-overdue-screenings">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="ml-4">
                    <p className="text-muted-foreground text-sm">Overdue Screenings</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-semibold text-foreground" data-testid="text-overdue-screenings">
                        {stats?.overdueScreenings || 0}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <Card data-testid="card-today-schedule">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center justify-between">
                    <span>Today's Schedule</span>
                    <Button variant="outline" size="sm" data-testid="button-view-all-appointments">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {appointmentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center p-4 space-x-4">
                          <Skeleton className="w-16 h-12" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="w-20 h-6" />
                        </div>
                      ))}
                    </div>
                  ) : todayAppointments && todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {todayAppointments.slice(0, 5).map((appointment) => (
                        <div key={appointment.id} className="flex items-center p-4 bg-accent rounded-lg border border-border" data-testid={`appointment-${appointment.id}`}>
                          <div className="flex-shrink-0 w-16 text-center">
                            <p className="text-sm font-medium text-foreground">
                              {formatTime(appointment.appointmentDate)}
                            </p>
                          </div>
                          <div className="flex-1 ml-4">
                            <h4 className="font-medium text-foreground">Patient ID: {appointment.patientId}</h4>
                            <p className="text-sm text-muted-foreground">{appointment.reason || appointment.appointmentType}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No appointments scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Lab Results and Alerts */}
            <div className="space-y-6">
              {/* Recent Lab Results */}
              <Card data-testid="card-recent-lab-results">
                <CardHeader className="border-b border-border">
                  <CardTitle>Recent Lab Results</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {labResultsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="w-16 h-6" />
                        </div>
                      ))}
                    </div>
                  ) : recentLabResults && recentLabResults.length > 0 ? (
                    <div className="space-y-3">
                      {recentLabResults.slice(0, 5).map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-accent rounded-lg" data-testid={`lab-result-${result.id}`}>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Patient: {result.patientId}</p>
                            <p className="text-xs text-muted-foreground">{result.testName}</p>
                          </div>
                          {getLabStatusBadge(result.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent lab results</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card data-testid="card-quick-actions">
                <CardHeader className="border-b border-border">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-new-patient">
                    <Users className="w-4 h-4 mr-2" />
                    Add New Patient
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-schedule-appointment">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-lab-results">
                    <Activity className="w-4 h-4 mr-2" />
                    View Lab Results
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-preventive-care">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Preventive Care
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
