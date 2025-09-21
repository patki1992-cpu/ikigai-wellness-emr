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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Calendar,
  User,
  Stethoscope,
  ClipboardList
} from "lucide-react";
import type { MedicalRecord, Patient } from "@shared/schema";

export default function MedicalRecords() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);

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

  const { data: medicalRecords, isLoading: recordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/patients", selectedPatient, "medical-records"],
    enabled: !!selectedPatient,
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

  const filteredRecords = medicalRecords?.filter(record => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      record.chiefComplaint?.toLowerCase().includes(searchLower) ||
      record.assessment?.toLowerCase().includes(searchLower) ||
      record.diagnosis?.some(d => d.toLowerCase().includes(searchLower))
    );
  });

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowRecordDetail(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Medical Records" subtitle="Manage patient medical records and visit notes">
          <Button 
            onClick={() => setShowRecordForm(true)}
            disabled={!selectedPatient}
            data-testid="button-new-record"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Record
          </Button>
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
                      placeholder="Search records..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-records"
                    />
                  </div>

                  {selectedPatient && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-2">Record Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Records</span>
                          <span className="font-medium" data-testid="text-total-records">
                            {medicalRecords?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Visit</span>
                          <span className="font-medium" data-testid="text-last-visit">
                            {medicalRecords?.[0] 
                              ? new Date(medicalRecords[0].visitDate).toLocaleDateString()
                              : "—"
                            }
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
                    data-testid="button-new-visit"
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    New Visit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-view-timeline"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Timeline
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-export-records"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Records
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Medical Records List */}
            <div className="lg:col-span-3">
              <Card data-testid="card-medical-records">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Medical Records</span>
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
                        Choose a patient from the sidebar to view their medical records
                      </p>
                    </div>
                  ) : recordsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex space-x-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredRecords && filteredRecords.length > 0 ? (
                    <div className="space-y-4">
                      {filteredRecords.map((record) => (
                        <div 
                          key={record.id} 
                          className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                          data-testid={`medical-record-${record.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-foreground">
                                  Visit - {new Date(record.visitDate).toLocaleDateString()}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(record.visitDate).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </Badge>
                              </div>
                              
                              {record.chiefComplaint && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  <strong>Chief Complaint:</strong> {record.chiefComplaint}
                                </p>
                              )}
                              
                              {record.assessment && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  <strong>Assessment:</strong> {record.assessment}
                                </p>
                              )}

                              {record.diagnosis && record.diagnosis.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className="text-xs text-muted-foreground mr-2">Diagnoses:</span>
                                  {record.diagnosis.map((diagnosis, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {diagnosis}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewRecord(record)}
                                data-testid={`button-view-record-${record.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-edit-record-${record.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {record.plan && (
                            <div className="text-sm bg-muted/50 p-3 rounded-lg">
                              <strong className="text-foreground">Plan:</strong>
                              <p className="text-muted-foreground mt-1">{record.plan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Medical Records</h3>
                      <p className="text-muted-foreground mb-4">
                        This patient has no medical records yet
                      </p>
                      <Button 
                        onClick={() => setShowRecordForm(true)}
                        data-testid="button-create-first-record"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Record
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <Dialog open={showRecordDetail} onOpenChange={setShowRecordDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                Medical Record - {new Date(selectedRecord.visitDate).toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6" data-testid="modal-record-detail">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Visit Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date & Time:</span>
                      <span className="text-foreground">
                        {new Date(selectedRecord.visitDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Record ID:</span>
                      <span className="font-mono text-xs">{selectedRecord.id}</span>
                    </div>
                  </div>
                </div>

                {selectedRecord.vitalSigns && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Vital Signs</h4>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <pre className="text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(selectedRecord.vitalSigns, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {selectedRecord.chiefComplaint && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Chief Complaint</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedRecord.chiefComplaint}
                  </p>
                </div>
              )}

              {selectedRecord.historyOfPresentIllness && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">History of Present Illness</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedRecord.historyOfPresentIllness}
                  </p>
                </div>
              )}

              {selectedRecord.physicalExam && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Physical Examination</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedRecord.physicalExam}
                  </p>
                </div>
              )}

              {selectedRecord.assessment && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Assessment</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedRecord.assessment}
                  </p>
                </div>
              )}

              {selectedRecord.diagnosis && selectedRecord.diagnosis.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Diagnoses</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.diagnosis.map((diagnosis, index) => (
                      <Badge key={index} variant="secondary">
                        {diagnosis}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.plan && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Treatment Plan</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedRecord.plan}
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
