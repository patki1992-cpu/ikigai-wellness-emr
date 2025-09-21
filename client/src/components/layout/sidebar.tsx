import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard,
  Users, 
  Calendar, 
  FileText, 
  Activity,
  Image,
  Pill,
  Shield,
  Apple,
  ChevronDown,
  ChevronRight
} from "lucide-react";

const healthcareManagementTabs = [
  {
    name: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    name: "Patient Care",
    items: [
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Medical Records", href: "/medical-records", icon: FileText },
    ]
  },
  {
    name: "Clinical Data",
    items: [
      { name: "Lab Results", href: "/lab-results", icon: Activity },
      { name: "Radiology", href: "/radiology", icon: Image },
      { name: "Medications", href: "/medications", icon: Pill },
    ]
  },
  {
    name: "Prevention & Wellness",
    items: [
      { name: "Preventive Care", href: "/preventive-care", icon: Shield },
      { name: "Diet Plans", href: "/diet-plans", icon: Apple },
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  
  // Find which tab contains the current active route
  const findActiveTab = (currentLocation: string) => {
    for (const tab of healthcareManagementTabs) {
      const hasActiveItem = tab.items.some(item => 
        currentLocation === item.href || (item.href !== "/" && currentLocation.startsWith(item.href))
      );
      if (hasActiveItem) return tab.name;
    }
    return "Overview"; // Default fallback
  };
  
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>(() => {
    const activeTab = findActiveTab(location);
    return {
      "Overview": activeTab === "Overview",
      "Patient Care": activeTab === "Patient Care",
      "Clinical Data": activeTab === "Clinical Data",
      "Prevention & Wellness": activeTab === "Prevention & Wellness",
    };
  });
  
  // Auto-expand tab containing current route when location changes
  useEffect(() => {
    const activeTab = findActiveTab(location);
    setExpandedTabs(prev => ({
      ...prev,
      [activeTab]: true
    }));
  }, [location]);

  const toggleTab = (tabName: string) => {
    setExpandedTabs(prev => ({
      ...prev,
      [tabName]: !prev[tabName]
    }));
  };

  const isItemActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="w-64 md:w-72 bg-card shadow-lg border-r border-border" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Ikigai Wellness</h1>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Comprehensive Healthcare Management
        </h2>
      </div>

      <nav className="sidebar-nav mt-2 px-4 overflow-y-auto" data-testid="nav-sidebar">
        <div className="space-y-2">
          {healthcareManagementTabs.map((tab) => (
            <div key={tab.name} className="space-y-1">
              <button
                onClick={() => toggleTab(tab.name)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                data-testid={`tab-${tab.name.toLowerCase().replace(/\s+/g, '-')}`}
                aria-expanded={expandedTabs[tab.name]}
                aria-controls={`tab-content-${tab.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="font-semibold">{tab.name}</span>
                {expandedTabs[tab.name] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedTabs[tab.name] && (
                <div 
                  className="ml-2 space-y-1 animate-slideIn"
                  id={`tab-content-${tab.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {tab.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                          isActive
                            ? "active bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
