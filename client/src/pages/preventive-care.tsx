import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPreventiveCareSchema } from "@shared/schema";
import { 
  Shield, 
  Search, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Filter,
  Download,
  Bell
} from "lucide-react";
import type { PreventiveCare, Patient } from "@shared/schema";
import type { z } from "zod";

type PreventiveCareFormData = z.infer<typeof insertPreventiveCareSchema>;

export default function PreventiveCare() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [showCareForm, setShowCareForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all-care");

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

  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ["/api/patients"],
    retry: false,
  });

  const { data: allPreventiveCare, isLoading: allCareLoading } = useQuery<PreventiveCare[]>({
    queryKey: ["/api/preventive-care"],
    enabled: activeTab === "all-care",
    retry: false,
  });

  const { data: patientPreventiveCare, isLoading: patientCareLoading } = useQuery<PreventiveCare[]>({
    queryKey: ["/api/preventive-care", selectedPatient],
    enabled: !!selectedPatient && activeTab === "patient-care",
    retry: false,
  });

  const { data: overduePreventiveCare, isLoading: overdueLoading } = useQuery<PreventiveCare[]>({
    queryKey: ["/api/preventive-care/overdue"],
    enabled: activeTab === "overdue",
    retry: false,
  });

  const createPreventiveCareMutation = useMutation({
    mutationFn: async (data: PreventiveCareFormData) => {
      await apiRequest("POST", "/api/preventive-care", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preventive-care"] });
      setShowCareForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Preventive care item added successfully",
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
        description: "Failed to add preventive care item",
        variant: "destructive",
      });
    },
  });

  const form = useForm<PreventiveCareFormData>({
    resolver: zodResolver(insertPreventiveCareSchema),
    defaultValues: {
      patientId: selectedPatient || "",
      careType: "",
      description: "",
      dueDate: "",
      completedDate: "",
      status: "due",
      notes: "",
    },
  });

  useEffect(() => {
    form.setValue("patientId", selectedPatient);
  }, [selectedPatient, form]);

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

  const getStatusBadge = (status: string, dueDate?: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === "due";
    
    if (isOverdue) {
      return <Badge variant="destructive" data-testid={`status-overdue`}>Overdue</Badge>;
    }
    
    switch (status) {
      case "due":
        return <Badge variant="secondary" data-testid={`status-${status}`}>Due</Badge>;
      case "completed":
        return <Badge className="lab-normal" data-testid={`status-${status}`}>Completed</Badge>;
      case "scheduled":
        return <Badge variant="outline" data-testid={`status-${status}`}>Scheduled</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string, dueDate?: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === "due";
    
    if (isOverdue) {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
    
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "due":
        return <Clock className="w-4 h-4 text-warning" />;
      case "scheduled":
        return <Calendar className="w-4 h-4 text-primary" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients?.patients?.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
  };

  const filteredCare = (() => {
    let data: PreventiveCare[] = [];
    
    if (activeTab === "all-care") {
      data = allPreventiveCare || [];
    } else if (activeTab === "patient-care") {
      data = patientPreventiveCare || [];
    } else if (activeTab === "overdue") {
      data = overduePreventiveCare || [];
    }

    return data.filter(care => {
      if (statusFilter !== "all" && care.status !== statusFilter) return false;
      if (!search) return true;
      
      const searchLower = search.toLowerCase();
      return (
        care.careType.toLowerCase().includes(searchLower) ||
        care.description?.toLowerCase().includes(searchLower) ||
        getPatientName(care.patientId).toLowerCase().includes(searchLower)
      );
    });
  })();

  const getCareLoading = () => {
    if (activeTab === "all-care") return allCareLoading;
    if (activeTab === "patient-care") return patientCareLoading;
    if (activeTab === "overdue") return overdueLoading;
    return false;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Preventive Care" subtitle="Manage immunizations and health screening reminders">
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-export-preventive-care">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowCareForm(true)}
              data-testid="button-new-preventive-care"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Care Item
            </Button>
          </div>
        </Header>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-care" data-testid="tab-all-care">All Care Items</TabsTrigger>
              <TabsTrigger value="patient-care" data-testid="tab-patient-care">Patient Care</TabsTrigger>
              <TabsTrigger value="overdue" data-testid="tab-overdue">Overdue Items</TabsTrigger>
            </TabsList>

            <TabsContent value="all-care" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters */}
                <div className="lg:col-span-1">
                  <Card data-testid="card-filters">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Filter className="w-5 h-5" />
                        <span>Filters</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search care items..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9"
                          data-testid="input-search-preventive-care"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger data-testid="select-status-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="due">Due</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium text-foreground mb-2">Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Items</span>
                            <span className="font-medium" data-testid="text-total-care-items">
                              {allPreventiveCare?.length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Due</span>
                            <span className="font-medium text-warning" data-testid="text-due-care-items">
                              {allPreventiveCare?.filter(c => c.status === "due").length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Overdue</span>
                            <span className="font-medium text-destructive" data-testid="text-overdue-care-items">
                              {overduePreventiveCare?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Care Items Table */}
                <div className="lg:col-span-3">
                  <Card data-testid="card-all-preventive-care">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>All Preventive Care Items</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getCareLoading() ? (
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3">
                              <div className="flex items-center space-x-3">
                                <Skeleton className="w-4 h-4" />
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="w-20 h-6" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredCare && filteredCare.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Care Type</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCare.map((care) => (
                                <TableRow key={care.id} className="hover:bg-accent" data-testid={`preventive-care-${care.id}`}>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(care.status, care.dueDate)}
                                      <div>
                                        <p className="font-medium text-foreground">{care.careType}</p>
                                        {care.description && (
                                          <p className="text-xs text-muted-foreground">{care.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm font-medium">{getPatientName(care.patientId)}</p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {care.dueDate ? new Date(care.dueDate).toLocaleDateString() : "—"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(care.status, care.dueDate)}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {care.notes ? care.notes.substring(0, 50) + (care.notes.length > 50 ? "..." : "") : "—"}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No Preventive Care Items</h3>
                          <p className="text-muted-foreground">No preventive care items match your current filters</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="patient-care" className="space-y-6">
              <Card data-testid="card-patient-preventive-care">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Patient Preventive Care</CardTitle>
                    <div className="w-64">
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger data-testid="select-patient-preventive-care">
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients?.patients?.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.firstName} {patient.lastName} ({patient.mrn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedPatient ? (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Select a Patient</h3>
                      <p className="text-muted-foreground">
                        Choose a patient to view their preventive care schedule
                      </p>
                    </div>
                  ) : patientCareLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : patientPreventiveCare && patientPreventiveCare.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {patientPreventiveCare.map((care) => (
                        <div key={care.id} className="p-4 border border-border rounded-lg" data-testid={`patient-preventive-care-${care.id}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(care.status, care.dueDate)}
                              <h4 className="font-medium text-foreground">{care.careType}</h4>
                            </div>
                            {getStatusBadge(care.status, care.dueDate)}
                          </div>
                          
                          {care.description && (
                            <p className="text-sm text-muted-foreground mb-2">{care.description}</p>
                          )}
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Due Date:</span>
                              <span className="font-medium">
                                {care.dueDate ? new Date(care.dueDate).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            {care.completedDate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Completed:</span>
                                <span className="font-medium">{new Date(care.completedDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          {care.notes && (
                            <div className="mt-2 text-xs bg-muted/50 p-2 rounded">
                              <strong>Notes:</strong> {care.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Preventive Care Items</h3>
                      <p className="text-muted-foreground">
                        This patient has no preventive care items scheduled
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overdue" className="space-y-6">
              <Card data-testid="card-overdue-preventive-care">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span>Overdue Preventive Care</span>
                    <Badge variant="destructive" className="ml-2">
                      {overduePreventiveCare?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overdueLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border border-border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="w-16 h-6" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : overduePreventiveCare && overduePreventiveCare.length > 0 ? (
                    <div className="space-y-4">
                      {overduePreventiveCare.map((care) => (
                        <div key={care.id} className="alert-high p-4 rounded-lg" data-testid={`overdue-preventive-care-${care.id}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                <h4 className="font-medium text-foreground">{care.careType}</h4>
                                <Badge variant="destructive">Overdue</Badge>
                              </div>
                              <p className="text-sm font-medium text-foreground mb-1">
                                Patient: {getPatientName(care.patientId)}
                              </p>
                              {care.description && (
                                <p className="text-sm text-muted-foreground mb-2">{care.description}</p>
                              )}
                              <div className="text-sm">
                                <span className="text-muted-foreground">Due Date: </span>
                                <span className="font-medium text-destructive">
                                  {care.dueDate ? new Date(care.dueDate).toLocaleDateString() : "—"}
                                </span>
                                {care.dueDate && (
                                  <span className="text-muted-foreground ml-2">
                                    ({Math.ceil((new Date().getTime() - new Date(care.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" data-testid={`button-schedule-${care.id}`}>
                                <Calendar className="w-4 h-4 mr-1" />
                                Schedule
                              </Button>
                              <Button size="sm" data-testid={`button-mark-completed-${care.id}`}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Complete
                              </Button>
                            </div>
                          </div>
                          {care.notes && (
                            <div className="text-xs bg-muted/50 p-2 rounded mt-2">
                              <strong>Notes:</strong> {care.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground">
                        No overdue preventive care items at this time
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Preventive Care Form Dialog */}
      <Dialog open={showCareForm} onOpenChange={setShowCareForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Preventive Care Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createPreventiveCareMutation.mutate(data))} className="space-y-4" data-testid="form-preventive-care">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-patient-form">
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients?.patients?.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.firstName} {patient.lastName} ({patient.mrn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="careType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-care-type">
                            <SelectValue placeholder="Select care type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Annual Physical">Annual Physical</SelectItem>
                          <SelectItem value="Mammogram">Mammogram</SelectItem>
                          <SelectItem value="Colonoscopy">Colonoscopy</SelectItem>
                          <SelectItem value="Flu Vaccine">Flu Vaccine</SelectItem>
                          <SelectItem value="COVID-19 Vaccine">COVID-19 Vaccine</SelectItem>
                          <SelectItem value="Blood Pressure Check">Blood Pressure Check</SelectItem>
                          <SelectItem value="Cholesterol Screening">Cholesterol Screening</SelectItem>
                          <SelectItem value="Diabetes Screening">Diabetes Screening</SelectItem>
                          <SelectItem value="Eye Exam">Eye Exam</SelectItem>
                          <SelectItem value="Dental Checkup">Dental Checkup</SelectItem>
                          <SelectItem value="Skin Cancer Screening">Skin Cancer Screening</SelectItem>
                          <SelectItem value="Bone Density Scan">Bone Density Scan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="due">Due</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional details about this preventive care item..."
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any special notes or instructions..."
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCareForm(false)}
                  disabled={createPreventiveCareMutation.isPending}
                  data-testid="button-cancel-preventive-care-form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPreventiveCareMutation.isPending}
                  data-testid="button-submit-preventive-care-form"
                >
                  {createPreventiveCareMutation.isPending ? "Adding..." : "Add Care Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
