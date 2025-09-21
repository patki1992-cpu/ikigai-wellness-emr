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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { insertMedicationSchema } from "@shared/schema";
import { 
  Pill, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Filter,
  Download
} from "lucide-react";
import type { Medication, Patient } from "@shared/schema";
import type { z } from "zod";

type MedicationFormData = z.infer<typeof insertMedicationSchema>;

export default function Medications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showMedicationDetail, setShowMedicationDetail] = useState(false);

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

  const { data: medications, isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/patients", selectedPatient, "medications"],
    enabled: !!selectedPatient,
    retry: false,
  });

  const createMedicationMutation = useMutation({
    mutationFn: async (data: MedicationFormData) => {
      await apiRequest("POST", "/api/medications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowMedicationForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Medication added successfully",
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
        description: "Failed to add medication",
        variant: "destructive",
      });
    },
  });

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(insertMedicationSchema),
    defaultValues: {
      patientId: selectedPatient || "",
      medicationName: "",
      dosage: "",
      frequency: "",
      route: "",
      startDate: "",
      endDate: "",
      status: "active",
      instructions: "",
      refills: 0,
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

  const filteredMedications = medications?.filter(medication => {
    if (statusFilter !== "all" && medication.status !== statusFilter) return false;
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      medication.medicationName.toLowerCase().includes(searchLower) ||
      medication.dosage.toLowerCase().includes(searchLower) ||
      medication.frequency.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="status-active" data-testid={`status-${status}`}>Active</Badge>;
      case "discontinued":
        return <Badge variant="destructive" data-testid={`status-${status}`}>Discontinued</Badge>;
      case "completed":
        return <Badge variant="secondary" data-testid={`status-${status}`}>Completed</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "discontinued":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "completed":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Pill className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleViewMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowMedicationDetail(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Medication Management" subtitle="Manage patient medications and prescriptions">
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-export-medications">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowMedicationForm(true)}
              disabled={!selectedPatient}
              data-testid="button-new-medication"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </Header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Patient Selector & Filters */}
            <div className="lg:col-span-1">
              <Card data-testid="card-patient-selector">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Select Patient</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger data-testid="select-patient">
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} ({patient.mrn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search medications..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-medications"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Medications</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPatient && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-2">Medication Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Medications</span>
                          <span className="font-medium" data-testid="text-total-medications">
                            {medications?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Active</span>
                          <span className="font-medium text-success" data-testid="text-active-medications">
                            {medications?.filter(m => m.status === "active").length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discontinued</span>
                          <span className="font-medium text-destructive" data-testid="text-discontinued-medications">
                            {medications?.filter(m => m.status === "discontinued").length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6" data-testid="card-quick-actions">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-prescription-refill"
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Prescription Refill
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-drug-interactions"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Drug Interactions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-medication-history"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Medication History
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Medications List */}
            <div className="lg:col-span-3">
              <Card data-testid="card-medications">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pill className="w-5 h-5" />
                    <span>Current Medications</span>
                    {selectedPatient && patients?.patients && (
                      <span className="text-base font-normal text-muted-foreground">
                        - {patients.patients.find(p => p.id === selectedPatient)?.firstName} {patients.patients.find(p => p.id === selectedPatient)?.lastName}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedPatient ? (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Select a Patient</h3>
                      <p className="text-muted-foreground">
                        Choose a patient from the sidebar to view their medications
                      </p>
                    </div>
                  ) : medicationsLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="w-16 h-6" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : filteredMedications && filteredMedications.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredMedications.map((medication) => (
                        <div 
                          key={medication.id} 
                          className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                          data-testid={`medication-${medication.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(medication.status)}
                              <h4 className="font-medium text-foreground">{medication.medicationName}</h4>
                            </div>
                            {getStatusBadge(medication.status)}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Dosage:</span>
                              <span className="font-medium">{medication.dosage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Frequency:</span>
                              <span className="font-medium">{medication.frequency}</span>
                            </div>
                            {medication.route && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Route:</span>
                                <span className="font-medium">{medication.route}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Started:</span>
                              <span className="font-medium">{new Date(medication.startDate).toLocaleDateString()}</span>
                            </div>
                            {medication.endDate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">End Date:</span>
                                <span className="font-medium">{new Date(medication.endDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {medication.refills !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Refills:</span>
                                <span className="font-medium">{medication.refills}</span>
                              </div>
                            )}
                          </div>

                          {medication.instructions && (
                            <div className="mt-3 text-xs bg-muted/50 p-2 rounded">
                              <strong>Instructions:</strong> {medication.instructions}
                            </div>
                          )}

                          <div className="flex items-center justify-end space-x-2 mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewMedication(medication)}
                              data-testid={`button-view-medication-${medication.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-edit-medication-${medication.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Medications</h3>
                      <p className="text-muted-foreground mb-4">
                        This patient has no medications on record
                      </p>
                      <Button 
                        onClick={() => setShowMedicationForm(true)}
                        data-testid="button-add-first-medication"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Medication
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Medication Form Dialog */}
      <Dialog open={showMedicationForm} onOpenChange={setShowMedicationForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMedicationMutation.mutate(data))} className="space-y-4" data-testid="form-medication">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medicationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Metformin" data-testid="input-medication-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 500mg" data-testid="input-dosage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Once daily">Once daily</SelectItem>
                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                          <SelectItem value="Three times daily">Three times daily</SelectItem>
                          <SelectItem value="Four times daily">Four times daily</SelectItem>
                          <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                          <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                          <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                          <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                          <SelectItem value="As needed">As needed</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-route">
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="Injectable">Injectable</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
                          <SelectItem value="Rectal">Rectal</SelectItem>
                          <SelectItem value="Sublingual">Sublingual</SelectItem>
                          <SelectItem value="Transdermal">Transdermal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-end-date" />
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Refills</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          data-testid="input-refills" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Take with food, avoid alcohol, etc."
                        data-testid="textarea-instructions"
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
                  onClick={() => setShowMedicationForm(false)}
                  disabled={createMedicationMutation.isPending}
                  data-testid="button-cancel-medication-form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMedicationMutation.isPending}
                  data-testid="button-submit-medication-form"
                >
                  {createMedicationMutation.isPending ? "Adding..." : "Add Medication"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Medication Detail Modal */}
      {selectedMedication && (
        <Dialog open={showMedicationDetail} onOpenChange={setShowMedicationDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMedication.medicationName}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4" data-testid="modal-medication-detail">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Medication Status</h4>
                {getStatusBadge(selectedMedication.status)}
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dosage:</span>
                    <span className="font-medium">{selectedMedication.dosage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{selectedMedication.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route:</span>
                    <span className="font-medium">{selectedMedication.route || "—"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{new Date(selectedMedication.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">{selectedMedication.endDate ? new Date(selectedMedication.endDate).toLocaleDateString() : "Ongoing"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refills:</span>
                    <span className="font-medium">{selectedMedication.refills || 0}</span>
                  </div>
                </div>
              </div>

              {selectedMedication.instructions && (
                <div>
                  <h5 className="font-medium text-foreground mb-2">Special Instructions</h5>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedMedication.instructions}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
