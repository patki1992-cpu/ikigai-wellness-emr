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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRadiologyResultSchema } from "@shared/schema";
import { 
  Image, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Download,
  Calendar,
  User,
  FileText,
  Filter
} from "lucide-react";
import type { RadiologyResult, Patient } from "@shared/schema";
import type { z } from "zod";

type RadiologyFormData = z.infer<typeof insertRadiologyResultSchema>;

export default function Radiology() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [showRadiologyForm, setShowRadiologyForm] = useState(false);
  const [selectedResult, setSelectedResult] = useState<RadiologyResult | null>(null);
  const [showResultDetail, setShowResultDetail] = useState(false);

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

  const { data: radiologyResults, isLoading: resultsLoading } = useQuery<RadiologyResult[]>({
    queryKey: ["/api/patients", selectedPatient, "radiology-results"],
    enabled: !!selectedPatient,
    retry: false,
  });

  const createRadiologyMutation = useMutation({
    mutationFn: async (data: RadiologyFormData) => {
      await apiRequest("POST", "/api/radiology-results", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowRadiologyForm(false);
      toast({
        title: "Success",
        description: "Radiology result created successfully",
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
        description: "Failed to create radiology result",
        variant: "destructive",
      });
    },
  });

  const form = useForm<RadiologyFormData>({
    resolver: zodResolver(insertRadiologyResultSchema),
    defaultValues: {
      patientId: selectedPatient || "",
      studyType: "",
      bodyPart: "",
      findings: "",
      impression: "",
      recommendation: "",
      studyDate: new Date(),
      imageUrl: "",
      reportUrl: "",
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

  const filteredResults = radiologyResults?.filter(result => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      result.studyType.toLowerCase().includes(searchLower) ||
      result.bodyPart?.toLowerCase().includes(searchLower) ||
      result.findings?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewResult = (result: RadiologyResult) => {
    setSelectedResult(result);
    setShowResultDetail(true);
  };

  const formatDateTimeLocal = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const handleDateChange = (value: string) => {
    if (value) {
      const date = new Date(value);
      return date.toISOString();
    }
    return value;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Radiology Results" subtitle="Manage imaging studies and radiologist reports">
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-export-radiology">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowRadiologyForm(true)}
              disabled={!selectedPatient}
              data-testid="button-new-radiology"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Study
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
                      placeholder="Search studies..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-radiology"
                    />
                  </div>

                  {selectedPatient && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-2">Study Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Studies</span>
                          <span className="font-medium" data-testid="text-total-studies">
                            {radiologyResults?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recent Study</span>
                          <span className="font-medium" data-testid="text-recent-study">
                            {radiologyResults?.[0] 
                              ? new Date(radiologyResults[0].studyDate).toLocaleDateString()
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
                    data-testid="button-order-study"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Order Study
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-view-images"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Images
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!selectedPatient}
                    data-testid="button-generate-report"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Radiology Results List */}
            <div className="lg:col-span-3">
              <Card data-testid="card-radiology-results">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Image className="w-5 h-5" />
                    <span>Radiology Studies</span>
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
                        Choose a patient from the sidebar to view their radiology studies
                      </p>
                    </div>
                  ) : resultsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : filteredResults && filteredResults.length > 0 ? (
                    <div className="space-y-4">
                      {filteredResults.map((result) => (
                        <div 
                          key={result.id} 
                          className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                          data-testid={`radiology-result-${result.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-foreground">{result.studyType}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(result.studyDate).toLocaleDateString()}
                                </Badge>
                                {result.bodyPart && (
                                  <Badge variant="secondary" className="text-xs">
                                    {result.bodyPart}
                                  </Badge>
                                )}
                              </div>
                              
                              {result.impression && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  <strong>Impression:</strong> {result.impression}
                                </p>
                              )}
                              
                              {result.findings && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  <strong>Findings:</strong> {result.findings.substring(0, 150)}
                                  {result.findings.length > 150 && "..."}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewResult(result)}
                                data-testid={`button-view-result-${result.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-edit-result-${result.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {result.recommendation && (
                            <div className="text-sm bg-muted/50 p-3 rounded-lg">
                              <strong className="text-foreground">Recommendation:</strong>
                              <p className="text-muted-foreground mt-1">{result.recommendation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Radiology Studies</h3>
                      <p className="text-muted-foreground mb-4">
                        This patient has no radiology studies yet
                      </p>
                      <Button 
                        onClick={() => setShowRadiologyForm(true)}
                        data-testid="button-create-first-study"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Study
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Radiology Form Dialog */}
      <Dialog open={showRadiologyForm} onOpenChange={setShowRadiologyForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Radiology Study</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createRadiologyMutation.mutate(data))} className="space-y-4" data-testid="form-radiology">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-study-type">
                            <SelectValue placeholder="Select study type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="X-Ray">X-Ray</SelectItem>
                          <SelectItem value="CT Scan">CT Scan</SelectItem>
                          <SelectItem value="MRI">MRI</SelectItem>
                          <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                          <SelectItem value="Mammography">Mammography</SelectItem>
                          <SelectItem value="Nuclear Medicine">Nuclear Medicine</SelectItem>
                          <SelectItem value="PET Scan">PET Scan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyPart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Part</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Chest, Abdomen, Brain" data-testid="input-body-part" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studyDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={formatDateTimeLocal(field.value)}
                          onChange={(e) => field.onChange(handleDateChange(e.target.value))}
                          data-testid="input-study-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Findings</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Detailed radiological findings..."
                        className="min-h-[100px]"
                        data-testid="textarea-findings"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impression</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Clinical impression and interpretation..."
                        data-testid="textarea-impression"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendation</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Clinical recommendations or follow-up..."
                        data-testid="textarea-recommendation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Link to DICOM viewer or images" data-testid="input-image-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Link to detailed report" data-testid="input-report-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRadiologyForm(false)}
                  disabled={createRadiologyMutation.isPending}
                  data-testid="button-cancel-radiology-form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRadiologyMutation.isPending}
                  data-testid="button-submit-radiology-form"
                >
                  {createRadiologyMutation.isPending ? "Creating..." : "Create Study"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Result Detail Modal */}
      {selectedResult && (
        <Dialog open={showResultDetail} onOpenChange={setShowResultDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedResult.studyType} - {new Date(selectedResult.studyDate).toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6" data-testid="modal-result-detail">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Study Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Study Type:</span>
                      <span className="text-foreground">{selectedResult.studyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Body Part:</span>
                      <span className="text-foreground">{selectedResult.bodyPart || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Study Date:</span>
                      <span className="text-foreground">
                        {new Date(selectedResult.studyDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Access Links</h4>
                  <div className="space-y-2">
                    {selectedResult.imageUrl && (
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-view-images">
                        <Image className="w-4 h-4 mr-2" />
                        View Images
                      </Button>
                    )}
                    {selectedResult.reportUrl && (
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-view-report">
                        <FileText className="w-4 h-4 mr-2" />
                        View Report
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {selectedResult.findings && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Findings</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedResult.findings}
                  </p>
                </div>
              )}

              {selectedResult.impression && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Impression</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedResult.impression}
                  </p>
                </div>
              )}

              {selectedResult.recommendation && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Recommendation</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedResult.recommendation}
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
