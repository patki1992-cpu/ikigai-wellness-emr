import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import LabTrends from "@/components/charts/lab-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Activity, 
  Search, 
  Filter, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Download
} from "lucide-react";
import type { LabResult, Patient } from "@shared/schema";

export default function LabResults() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [activeTab, setActiveTab] = useState("all-results");

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

  const { data: recentLabResults, isLoading: recentLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/lab-results/recent", "50"],
    retry: false,
  });

  const { data: patientLabResults, isLoading: patientLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/patients", selectedPatient, "lab-results"],
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return <Badge className="lab-normal" data-testid={`status-${status}`}>Normal</Badge>;
      case "abnormal":
        return <Badge className="lab-abnormal" data-testid={`status-${status}`}>Abnormal</Badge>;
      case "critical":
        return <Badge className="lab-critical" data-testid={`status-${status}`}>Critical</Badge>;
      case "pending":
        return <Badge variant="outline" data-testid={`status-${status}`}>Pending</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "abnormal":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "pending":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredResults = (activeTab === "patient-results" ? patientLabResults : recentLabResults)?.filter(result => {
    if (statusFilter !== "all" && result.status !== statusFilter) return false;
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      result.testName.toLowerCase().includes(searchLower) ||
      result.patientId.toLowerCase().includes(searchLower) ||
      result.result?.toLowerCase().includes(searchLower)
    );
  });

  const getPatientName = (patientId: string) => {
    const patient = patients?.patients?.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
  };

  const getUniqueTestNames = () => {
    const results = selectedPatient ? patientLabResults : recentLabResults;
    if (!results) return [];
    
    const testNames = [...new Set(results.map(r => r.testName))];
    return testNames.slice(0, 6); // Limit to 6 trending charts
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Laboratory Results" subtitle="View and analyze patient lab results">
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-export-results">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button data-testid="button-new-lab-order">
              <Plus className="w-4 h-4 mr-2" />
              New Lab Order
            </Button>
          </div>
        </Header>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-results" data-testid="tab-all-results">All Results</TabsTrigger>
              <TabsTrigger value="patient-results" data-testid="tab-patient-results">Patient Results</TabsTrigger>
              <TabsTrigger value="trending" data-testid="tab-trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="all-results" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters and Summary */}
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
                          placeholder="Search results..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9"
                          data-testid="input-search-lab-results"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger data-testid="select-status-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Results</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="abnormal">Abnormal</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium text-foreground mb-2">Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Results</span>
                            <span className="font-medium" data-testid="text-total-results">
                              {recentLabResults?.length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Normal</span>
                            <span className="font-medium text-success" data-testid="text-normal-results">
                              {recentLabResults?.filter(r => r.status === "normal").length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Abnormal</span>
                            <span className="font-medium text-warning" data-testid="text-abnormal-results">
                              {recentLabResults?.filter(r => r.status === "abnormal").length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Critical</span>
                            <span className="font-medium text-destructive" data-testid="text-critical-results">
                              {recentLabResults?.filter(r => r.status === "critical").length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Table */}
                <div className="lg:col-span-3">
                  <Card data-testid="card-lab-results">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>Recent Lab Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentLoading ? (
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
                              <div className="text-right space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="w-20 h-6" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredResults && filteredResults.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Test</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Normal Range</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredResults.map((result) => (
                                <TableRow key={result.id} className="hover:bg-accent" data-testid={`lab-result-${result.id}`}>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(result.status)}
                                      <div>
                                        <p className="font-medium text-foreground">{result.testName}</p>
                                        {result.testCode && (
                                          <p className="text-xs text-muted-foreground font-mono">{result.testCode}</p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm font-medium">{getPatientName(result.patientId)}</p>
                                    <p className="text-xs text-muted-foreground">{result.patientId}</p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {result.result || "—"}
                                      {result.units && (
                                        <span className="text-muted-foreground ml-1">{result.units}</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {result.normalRange || "—"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(result.status)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <p>{result.resultDate ? new Date(result.resultDate).toLocaleDateString() : "—"}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Ordered: {new Date(result.orderDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No Lab Results</h3>
                          <p className="text-muted-foreground">No lab results match your current filters</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="patient-results" className="space-y-6">
              <Card data-testid="card-patient-lab-results">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Patient Lab Results</CardTitle>
                    <div className="w-64">
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger data-testid="select-patient-lab">
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
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Select a Patient</h3>
                      <p className="text-muted-foreground">
                        Choose a patient to view their lab results and trends
                      </p>
                    </div>
                  ) : patientLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : patientLabResults && patientLabResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {patientLabResults.map((result) => (
                          <div key={result.id} className="p-4 border border-border rounded-lg" data-testid={`patient-lab-result-${result.id}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-foreground">{result.testName}</h4>
                              {getStatusBadge(result.status)}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Result:</span>
                                <span className="font-medium">
                                  {result.result || "Pending"} {result.units}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Normal Range:</span>
                                <span className="text-muted-foreground text-xs">{result.normalRange || "—"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="text-muted-foreground text-xs">
                                  {result.resultDate ? new Date(result.resultDate).toLocaleDateString() : "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Lab Results</h3>
                      <p className="text-muted-foreground">
                        This patient has no lab results on record
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <Card data-testid="card-lab-trending">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Lab Result Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    patientLabResults && patientLabResults.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {getUniqueTestNames().map((testName) => (
                          <LabTrends
                            key={testName}
                            labResults={patientLabResults}
                            testName={testName}
                            normalRange={
                              testName.toLowerCase().includes("glucose") 
                                ? { min: 70, max: 140 }
                                : testName.toLowerCase().includes("cholesterol")
                                ? { min: 0, max: 200 }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Data for Trending</h3>
                        <p className="text-muted-foreground">
                          Selected patient needs multiple lab results for trending analysis
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Select a Patient</h3>
                      <p className="text-muted-foreground">
                        Choose a patient from the Patient Results tab to view trending data
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
