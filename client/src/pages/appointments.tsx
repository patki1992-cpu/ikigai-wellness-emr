import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AppointmentForm from "@/components/forms/appointment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CalendarIcon, Plus, Clock, User, MapPin, MoreHorizontal, Eye, Edit } from "lucide-react";
import type { Appointment } from "@shared/schema";

export default function Appointments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

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

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      
      const response = await fetch(`/api/appointments?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    retry: false,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      console.log("Submitting appointment data:", appointmentData);
      return await apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowAppointmentForm(false);
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to schedule appointment",
        variant: "destructive",
      });
    },
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
        return <Badge variant="secondary" className="status-scheduled" data-testid={`status-${status}`}>Scheduled</Badge>;
      case "completed":
        return <Badge className="status-completed" data-testid={`status-${status}`}>Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="status-cancelled" data-testid={`status-${status}`}>Cancelled</Badge>;
      case "no_show":
        return <Badge variant="outline" data-testid={`status-${status}`}>No Show</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const getAppointmentsByTimeSlot = () => {
    if (!appointments) return [];
    
    return appointments
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
      .reduce((acc, appointment) => {
        const timeSlot = formatTime(appointment.appointmentDate);
        const existing = acc.find(slot => slot.time === timeSlot);
        
        if (existing) {
          existing.appointments.push(appointment);
        } else {
          acc.push({
            time: timeSlot,
            appointments: [appointment]
          });
        }
        
        return acc;
      }, [] as { time: string; appointments: Appointment[] }[]);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Appointment Management" subtitle="Schedule and manage patient appointments">
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            data-testid="button-new-appointment"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </Header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Date Selector */}
            <div className="lg:col-span-1">
              <Card data-testid="card-date-selector">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5" />
                    <span>Select Date</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                    data-testid="input-select-date"
                  />
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Appointments</span>
                      <span className="font-medium" data-testid="text-total-appointments">
                        {appointments?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium text-success" data-testid="text-completed-appointments">
                        {appointments?.filter(apt => apt.status === "completed").length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="font-medium text-primary" data-testid="text-scheduled-appointments">
                        {appointments?.filter(apt => apt.status === "scheduled").length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6" data-testid="card-quick-actions">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-today">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Today
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-week">
                    <Calendar className="w-4 h-4 mr-2" />
                    View This Week
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-patient-search">
                    <User className="w-4 h-4 mr-2" />
                    Patient Search
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Appointments Schedule */}
            <div className="lg:col-span-3">
              <Card data-testid="card-appointments-schedule">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" data-testid="button-refresh-appointments">
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-print-schedule">
                        Print Schedule
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center p-4 space-x-4 border border-border rounded-lg">
                          <Skeleton className="w-16 h-12" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="w-20 h-6" />
                          <Skeleton className="w-8 h-8" />
                        </div>
                      ))}
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <div className="space-y-4">
                      {getAppointmentsByTimeSlot().map((timeSlot, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-medium text-foreground">{timeSlot.time}</h4>
                          </div>
                          {timeSlot.appointments.map((appointment) => (
                            <div 
                              key={appointment.id} 
                              className="flex items-center p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors"
                              data-testid={`appointment-${appointment.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h5 className="font-medium text-foreground">
                                    Patient ID: {appointment.patientId}
                                  </h5>
                                  <Badge variant="outline" className="text-xs">
                                    {appointment.appointmentType}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {appointment.reason || "No reason specified"}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{appointment.duration} min</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>Provider Visit</span>
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {getStatusBadge(appointment.status)}
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-view-appointment-${appointment.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-edit-appointment-${appointment.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-more-appointment-${appointment.id}`}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No appointments scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        No appointments are scheduled for {new Date(selectedDate).toLocaleDateString()}
                      </p>
                      <Button 
                        onClick={() => setShowAppointmentForm(true)}
                        data-testid="button-schedule-first-appointment"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule First Appointment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Form Dialog */}
      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            onSubmit={(data) => createAppointmentMutation.mutate(data)}
            onCancel={() => setShowAppointmentForm(false)}
            isLoading={createAppointmentMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
