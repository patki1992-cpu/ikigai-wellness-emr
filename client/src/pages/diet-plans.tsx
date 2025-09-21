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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDietPlanSchema, insertMealEntrySchema } from "@shared/schema";
import { 
  Apple, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  User,
  Filter,
  Download,
  Utensils,
  Calendar,
  TrendingUp,
  Target,
  ChefHat
} from "lucide-react";
import type { DietPlan, MealEntry, Patient } from "@shared/schema";
import type { z } from "zod";

type DietPlanFormData = z.infer<typeof insertDietPlanSchema>;
type MealEntryFormData = z.infer<typeof insertMealEntrySchema>;

export default function DietPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [showDietPlanForm, setShowDietPlanForm] = useState(false);
  const [showMealEntryForm, setShowMealEntryForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [showPlanDetail, setShowPlanDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState("diet-plans");

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

  const { data: dietPlans, isLoading: plansLoading } = useQuery<DietPlan[]>({
    queryKey: ["/api/patients", selectedPatient, "diet-plans"],
    enabled: !!selectedPatient,
    retry: false,
  });

  const { data: mealEntries, isLoading: mealsLoading } = useQuery<MealEntry[]>({
    queryKey: ["/api/diet-plans", selectedPlan?.id, "meal-entries", selectedDate],
    enabled: !!selectedPlan?.id && activeTab === "meal-tracking",
    retry: false,
  });

  const createDietPlanMutation = useMutation({
    mutationFn: async (data: DietPlanFormData) => {
      await apiRequest("POST", "/api/diet-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowDietPlanForm(false);
      dietPlanForm.reset();
      toast({
        title: "Success",
        description: "Diet plan created successfully",
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
        description: "Failed to create diet plan",
        variant: "destructive",
      });
    },
  });

  const createMealEntryMutation = useMutation({
    mutationFn: async (data: MealEntryFormData) => {
      await apiRequest("POST", "/api/meal-entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diet-plans"] });
      setShowMealEntryForm(false);
      mealEntryForm.reset();
      toast({
        title: "Success",
        description: "Meal entry logged successfully",
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
        description: "Failed to log meal entry",
        variant: "destructive",
      });
    },
  });

  const dietPlanForm = useForm<DietPlanFormData>({
    resolver: zodResolver(insertDietPlanSchema),
    defaultValues: {
      patientId: selectedPatient || "",
      planName: "",
      description: "",
      dailyCalories: null,
      dailyProtein: null,
      dailyCarbs: null,
      dailyFat: null,
      restrictions: [],
      goals: [],
      isActive: true,
    },
  });

  const mealEntryForm = useForm<MealEntryFormData>({
    resolver: zodResolver(insertMealEntrySchema),
    defaultValues: {
      dietPlanId: selectedPlan?.id || "",
      patientId: selectedPatient || "",
      mealType: "",
      foodItem: "",
      quantity: "",
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      loggedDate: selectedDate,
    },
  });

  useEffect(() => {
    dietPlanForm.setValue("patientId", selectedPatient);
    mealEntryForm.setValue("patientId", selectedPatient);
  }, [selectedPatient, dietPlanForm, mealEntryForm]);

  useEffect(() => {
    mealEntryForm.setValue("dietPlanId", selectedPlan?.id || "");
    mealEntryForm.setValue("loggedDate", selectedDate);
  }, [selectedPlan, selectedDate, mealEntryForm]);

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

  const filteredPlans = dietPlans?.filter(plan => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      plan.planName.toLowerCase().includes(searchLower) ||
      plan.description?.toLowerCase().includes(searchLower) ||
      plan.goals?.some(goal => goal.toLowerCase().includes(searchLower)) ||
      plan.restrictions?.some(restriction => restriction.toLowerCase().includes(searchLower))
    );
  });

  const getPatientName = (patientId: string) => {
    const patient = patients?.patients?.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
  };

  const handleViewPlan = (plan: DietPlan) => {
    setSelectedPlan(plan);
    setShowPlanDetail(true);
  };

  const getMealsByType = () => {
    if (!mealEntries) return {};
    
    return mealEntries.reduce((acc, entry) => {
      if (!acc[entry.mealType]) {
        acc[entry.mealType] = [];
      }
      acc[entry.mealType].push(entry);
      return acc;
    }, {} as Record<string, MealEntry[]>);
  };

  const getDailyTotals = () => {
    if (!mealEntries) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    return mealEntries.reduce((acc, entry) => {
      acc.calories += entry.calories || 0;
      acc.protein += parseFloat(entry.protein?.toString() || "0");
      acc.carbs += parseFloat(entry.carbs?.toString() || "0");
      acc.fat += parseFloat(entry.fat?.toString() || "0");
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const mealsByType = getMealsByType();
  const dailyTotals = getDailyTotals();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Diet Planning" subtitle="Collaborative meal planning and nutritional tracking">
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-export-diet-plans">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowDietPlanForm(true)}
              disabled={!selectedPatient}
              data-testid="button-new-diet-plan"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Diet Plan
            </Button>
          </div>
        </Header>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diet-plans" data-testid="tab-diet-plans">Diet Plans</TabsTrigger>
              <TabsTrigger value="meal-tracking" data-testid="tab-meal-tracking">Meal Tracking</TabsTrigger>
              <TabsTrigger value="nutrition-analysis" data-testid="tab-nutrition-analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="diet-plans" className="space-y-6">
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
                          placeholder="Search diet plans..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9"
                          data-testid="input-search-diet-plans"
                        />
                      </div>

                      {selectedPatient && (
                        <div className="pt-4 border-t border-border">
                          <h4 className="font-medium text-foreground mb-2">Plan Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Plans</span>
                              <span className="font-medium" data-testid="text-total-diet-plans">
                                {dietPlans?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Active</span>
                              <span className="font-medium text-success" data-testid="text-active-diet-plans">
                                {dietPlans?.filter(p => p.isActive).length || 0}
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
                        data-testid="button-template-plans"
                      >
                        <ChefHat className="w-4 h-4 mr-2" />
                        Template Plans
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={!selectedPatient}
                        data-testid="button-nutrition-goals"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Set Goals
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={!selectedPatient}
                        data-testid="button-meal-templates"
                      >
                        <Utensils className="w-4 h-4 mr-2" />
                        Meal Templates
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Diet Plans List */}
                <div className="lg:col-span-3">
                  <Card data-testid="card-diet-plans">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Apple className="w-5 h-5" />
                        <span>Diet Plans</span>
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
                            Choose a patient from the sidebar to view their diet plans
                          </p>
                        </div>
                      ) : plansLoading ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="w-16 h-6" />
                              </div>
                              <Skeleton className="h-4 w-full" />
                              <div className="grid grid-cols-2 gap-2">
                                <Skeleton className="h-16" />
                                <Skeleton className="h-16" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredPlans && filteredPlans.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {filteredPlans.map((plan) => (
                            <div 
                              key={plan.id} 
                              className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                              data-testid={`diet-plan-${plan.id}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-medium text-foreground">{plan.planName}</h4>
                                    {plan.isActive ? (
                                      <Badge className="status-active">Active</Badge>
                                    ) : (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                  </div>
                                  {plan.description && (
                                    <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <h5 className="font-medium text-foreground mb-2 text-sm">Daily Targets</h5>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Calories</span>
                                      <span>{plan.dailyCalories || "—"} kcal</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Protein</span>
                                      <span>{plan.dailyProtein || "—"}g</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Carbs</span>
                                      <span>{plan.dailyCarbs || "—"}g</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Fat</span>
                                      <span>{plan.dailyFat || "—"}g</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <h5 className="font-medium text-foreground mb-2 text-sm">Restrictions & Goals</h5>
                                  <div className="space-y-2">
                                    {plan.restrictions && plan.restrictions.length > 0 && (
                                      <div>
                                        <div className="flex flex-wrap gap-1">
                                          {plan.restrictions.slice(0, 2).map((restriction, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {restriction}
                                            </Badge>
                                          ))}
                                          {plan.restrictions.length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                              +{plan.restrictions.length - 2} more
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {plan.goals && plan.goals.length > 0 && (
                                      <div>
                                        <div className="flex flex-wrap gap-1">
                                          {plan.goals.slice(0, 2).map((goal, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {goal}
                                            </Badge>
                                          ))}
                                          {plan.goals.length > 2 && (
                                            <Badge variant="secondary" className="text-xs">
                                              +{plan.goals.length - 2} more
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Created: {new Date(plan.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPlan(plan);
                                      setActiveTab("meal-tracking");
                                    }}
                                    data-testid={`button-track-meals-${plan.id}`}
                                  >
                                    <Utensils className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewPlan(plan)}
                                    data-testid={`button-view-plan-${plan.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-edit-plan-${plan.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No Diet Plans</h3>
                          <p className="text-muted-foreground mb-4">
                            This patient has no diet plans yet
                          </p>
                          <Button 
                            onClick={() => setShowDietPlanForm(true)}
                            data-testid="button-create-first-diet-plan"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Diet Plan
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meal-tracking" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Date Selector & Plan Selector */}
                <div className="lg:col-span-1">
                  <Card data-testid="card-meal-tracking-controls">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>Tracking Controls</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Active Diet Plan</label>
                        <Select value={selectedPlan?.id || ""} onValueChange={(value) => {
                          const plan = dietPlans?.find(p => p.id === value);
                          setSelectedPlan(plan || null);
                        }}>
                          <SelectTrigger data-testid="select-diet-plan">
                            <SelectValue placeholder="Select diet plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {dietPlans?.filter(p => p.isActive).map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.planName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Date</label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          data-testid="input-tracking-date"
                        />
                      </div>

                      {selectedPlan && (
                        <div className="pt-4 border-t border-border">
                          <h4 className="font-medium text-foreground mb-2">Daily Progress</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Calories</span>
                              <span className="font-medium">
                                {dailyTotals.calories} / {selectedPlan.dailyCalories || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Protein</span>
                              <span className="font-medium">
                                {dailyTotals.protein.toFixed(1)}g / {selectedPlan.dailyProtein || "—"}g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Carbs</span>
                              <span className="font-medium">
                                {dailyTotals.carbs.toFixed(1)}g / {selectedPlan.dailyCarbs || "—"}g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Fat</span>
                              <span className="font-medium">
                                {dailyTotals.fat.toFixed(1)}g / {selectedPlan.dailyFat || "—"}g
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Meal Entries */}
                <div className="lg:col-span-3">
                  <Card data-testid="card-meal-entries">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Utensils className="w-5 h-5" />
                          <span>Meal Log - {new Date(selectedDate).toLocaleDateString()}</span>
                        </CardTitle>
                        <Button 
                          onClick={() => setShowMealEntryForm(true)}
                          disabled={!selectedPlan}
                          size="sm"
                          data-testid="button-log-meal"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Log Meal
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!selectedPlan ? (
                        <div className="text-center py-12">
                          <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">Select a Diet Plan</h3>
                          <p className="text-muted-foreground">
                            Choose an active diet plan to start meal tracking
                          </p>
                        </div>
                      ) : mealsLoading ? (
                        <div className="space-y-4">
                          {["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => (
                            <div key={mealType} className="border border-border rounded-lg p-4">
                              <Skeleton className="h-6 w-24 mb-3" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => (
                            <div key={mealType} className="border border-border rounded-lg p-4" data-testid={`meal-section-${mealType.toLowerCase()}`}>
                              <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                                <Utensils className="w-4 h-4" />
                                <span>{mealType}</span>
                              </h4>
                              
                              {mealsByType[mealType] && mealsByType[mealType].length > 0 ? (
                                <div className="space-y-2">
                                  {mealsByType[mealType].map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`meal-entry-${entry.id}`}>
                                      <div className="flex-1">
                                        <p className="font-medium text-foreground">{entry.foodItem}</p>
                                        <p className="text-sm text-muted-foreground">{entry.quantity}</p>
                                      </div>
                                      <div className="text-right text-sm">
                                        <p className="font-medium">{entry.calories || 0} cal</p>
                                        <p className="text-muted-foreground">
                                          {entry.protein || 0}p / {entry.carbs || 0}c / {entry.fat || 0}f
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No meals logged for {mealType.toLowerCase()}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nutrition-analysis" className="space-y-6">
              <Card data-testid="card-nutrition-analysis">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Nutrition Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Nutrition Analytics</h3>
                    <p className="text-muted-foreground">
                      Detailed nutrition analysis and trending will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Diet Plan Form Dialog */}
      <Dialog open={showDietPlanForm} onOpenChange={setShowDietPlanForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Diet Plan</DialogTitle>
          </DialogHeader>
          <Form {...dietPlanForm}>
            <form onSubmit={dietPlanForm.handleSubmit((data) => createDietPlanMutation.mutate(data))} className="space-y-4" data-testid="form-diet-plan">
              <FormField
                control={dietPlanForm.control}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Heart-Healthy Diet Plan" data-testid="input-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dietPlanForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe the diet plan objectives and approach..."
                        data-testid="textarea-plan-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={dietPlanForm.control}
                  name="dailyCalories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Calories</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="2000"
                          data-testid="input-daily-calories"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dietPlanForm.control}
                  name="dailyProtein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="120"
                          data-testid="input-daily-protein"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dietPlanForm.control}
                  name="dailyCarbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="250"
                          data-testid="input-daily-carbs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dietPlanForm.control}
                  name="dailyFat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="67"
                          data-testid="input-daily-fat"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={dietPlanForm.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dietary Restrictions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter restrictions separated by commas (e.g., Low Sodium, Dairy Free, Gluten Free)"
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                          data-testid="textarea-restrictions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dietPlanForm.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Goals</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter goals separated by commas (e.g., Weight Loss, Heart Health, Diabetes Management)"
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                          data-testid="textarea-goals"
                        />
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
                  onClick={() => setShowDietPlanForm(false)}
                  disabled={createDietPlanMutation.isPending}
                  data-testid="button-cancel-diet-plan-form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDietPlanMutation.isPending}
                  data-testid="button-submit-diet-plan-form"
                >
                  {createDietPlanMutation.isPending ? "Creating..." : "Create Diet Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Meal Entry Form Dialog */}
      <Dialog open={showMealEntryForm} onOpenChange={setShowMealEntryForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Log Meal Entry</DialogTitle>
          </DialogHeader>
          <Form {...mealEntryForm}>
            <form onSubmit={mealEntryForm.handleSubmit((data) => createMealEntryMutation.mutate(data))} className="space-y-4" data-testid="form-meal-entry">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={mealEntryForm.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-meal-type">
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Lunch">Lunch</SelectItem>
                          <SelectItem value="Dinner">Dinner</SelectItem>
                          <SelectItem value="Snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mealEntryForm.control}
                  name="foodItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Item *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Grilled Chicken Breast" data-testid="input-food-item" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mealEntryForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 1 cup, 3 oz" data-testid="input-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mealEntryForm.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="250"
                          data-testid="input-meal-calories"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mealEntryForm.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="25"
                          data-testid="input-meal-protein"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mealEntryForm.control}
                  name="carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="30"
                          data-testid="input-meal-carbs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mealEntryForm.control}
                  name="fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="10"
                          data-testid="input-meal-fat"
                        />
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
                  onClick={() => setShowMealEntryForm(false)}
                  disabled={createMealEntryMutation.isPending}
                  data-testid="button-cancel-meal-entry-form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMealEntryMutation.isPending}
                  data-testid="button-submit-meal-entry-form"
                >
                  {createMealEntryMutation.isPending ? "Logging..." : "Log Meal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <Dialog open={showPlanDetail} onOpenChange={setShowPlanDetail}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedPlan.planName}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6" data-testid="modal-plan-detail">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Plan Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-foreground">
                        {selectedPlan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-foreground">
                        {new Date(selectedPlan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Daily Nutrition Targets</h4>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calories:</span>
                      <span className="font-medium">{selectedPlan.dailyCalories || "—"} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protein:</span>
                      <span className="font-medium">{selectedPlan.dailyProtein || "—"}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carbohydrates:</span>
                      <span className="font-medium">{selectedPlan.dailyCarbs || "—"}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fat:</span>
                      <span className="font-medium">{selectedPlan.dailyFat || "—"}g</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPlan.description && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedPlan.description}
                  </p>
                </div>
              )}

              {selectedPlan.restrictions && selectedPlan.restrictions.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Dietary Restrictions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.restrictions.map((restriction, index) => (
                      <Badge key={index} variant="outline">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlan.goals && selectedPlan.goals.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Diet Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.goals.map((goal, index) => (
                      <Badge key={index} variant="secondary">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
