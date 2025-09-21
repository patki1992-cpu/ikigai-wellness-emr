import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PatientForm from "@/components/forms/patient-form";
import PatientModal from "@/components/modals/patient-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  MoreHorizontal,
  User,
  Upload,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Patient } from "@shared/schema";

interface PatientsResponse {
  patients: Patient[];
  total: number;
}

export default function Patients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const pageSize = 10;

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

  const { data: patientsData, isLoading: patientsLoading } = useQuery<PatientsResponse>({
    queryKey: ["/api/patients", search, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/patients?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    retry: false,
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patientData: any) => {
      await apiRequest("POST", "/api/patients", patientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowPatientForm(false);
      toast({
        title: "Success",
        description: "Patient created successfully",
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
        description: "Failed to create patient",
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

  const totalPages = Math.ceil((patientsData?.total || 0) / pageSize);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

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

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Patient Management" subtitle="Manage patient records and information">
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-import-records">
              <Upload className="w-4 h-4 mr-2" />
              Import Records
            </Button>
            <Button 
              onClick={() => setShowPatientForm(true)}
              data-testid="button-new-patient"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Patient
            </Button>
          </div>
        </Header>

        <div className="flex-1 overflow-auto p-6">
          <Card>
            {/* Search and Filters */}
            <CardHeader className="border-b border-border">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, MRN, or DOB..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-patients"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48" data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patients</SelectItem>
                      <SelectItem value="new">New Patients</SelectItem>
                      <SelectItem value="follow-up">Follow-up Required</SelectItem>
                      <SelectItem value="overdue">Overdue Screenings</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ageFilter} onValueChange={setAgeFilter}>
                    <SelectTrigger className="w-48" data-testid="select-age-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="pediatric">Pediatric (0-17)</SelectItem>
                      <SelectItem value="adult">Adult (18-64)</SelectItem>
                      <SelectItem value="geriatric">Geriatric (65+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            {/* Patient Table */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsLoading ? (
                      Array.from({ length: pageSize }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : patientsData?.patients && patientsData.patients.length > 0 ? (
                      patientsData.patients.map((patient) => (
                        <TableRow key={patient.id} className="hover:bg-accent" data-testid={`patient-row-${patient.id}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                                <span className="text-secondary-foreground text-sm font-medium">
                                  {getInitials(patient.firstName, patient.lastName)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-foreground">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {patient.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{patient.mrn}</TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">({getAge(patient.dateOfBirth)} years)</div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{patient.gender}</TableCell>
                          <TableCell>{patient.phone || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewPatient(patient)}
                                data-testid={`button-view-patient-${patient.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-edit-patient-${patient.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-more-patient-${patient.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No patients found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {patientsData && patientsData.total > pageSize && (
                <div className="px-6 py-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, patientsData.total)} of {patientsData.total} patients
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              data-testid={`button-page-${pageNum}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Patient Form Dialog */}
      <Dialog open={showPatientForm} onOpenChange={setShowPatientForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm
            onSubmit={(data) => createPatientMutation.mutate(data)}
            onCancel={() => setShowPatientForm(false)}
            isLoading={createPatientMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          isOpen={showPatientModal}
          onClose={() => {
            setShowPatientModal(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
}
