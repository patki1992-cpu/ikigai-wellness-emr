import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import PatientDashboard from "@/pages/patient-dashboard";
import Patients from "@/pages/patients";
import Appointments from "@/pages/appointments";
import MedicalRecords from "@/pages/medical-records";
import LabResults from "@/pages/lab-results";
import Radiology from "@/pages/radiology";
import Medications from "@/pages/medications";
import PreventiveCare from "@/pages/preventive-care";
import DietPlans from "@/pages/diet-plans";

function Router() {
  const { isAuthenticated, isLoading, isProvider, isPatient } = useAuth();

  // Function to determine what to show on the root path
  const getRootComponent = () => {
    if (isLoading || !isAuthenticated) return Landing;
    if (isProvider) return Dashboard;
    if (isPatient) return PatientDashboard;
    return Landing; // Fallback
  };

  return (
    <Switch>
      <Route path="/" component={getRootComponent()} />
      <Route path="/dashboard" component={!isLoading && isProvider ? Dashboard : Landing} />
      <Route path="/patient-dashboard" component={!isLoading && isPatient ? PatientDashboard : Landing} />
      <Route path="/patient-portal" component={!isLoading && isPatient ? PatientDashboard : Landing} />
      {!isLoading && isAuthenticated && isProvider && (
        <>
          <Route path="/patients" component={Patients} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/medical-records" component={MedicalRecords} />
          <Route path="/lab-results" component={LabResults} />
          <Route path="/radiology" component={Radiology} />
          <Route path="/medications" component={Medications} />
          <Route path="/preventive-care" component={PreventiveCare} />
          <Route path="/diet-plans" component={DietPlans} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
