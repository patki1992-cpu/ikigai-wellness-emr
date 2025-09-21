import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Calendar, 
  Users, 
  FileText, 
  Shield, 
  HeartHandshake 
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Ikigai Wellness</h1>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Provider Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Comprehensive Electronic Medical Records
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Streamline patient care with our advanced EMR system featuring integrated 
            appointment scheduling, lab results management, preventive care tracking, 
            and collaborative diet planning.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-get-started"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comprehensive Healthcare Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to provide exceptional patient care in one integrated platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>
                  Complete patient profiles with demographics, medical history, and contact information
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Appointment Scheduling</CardTitle>
                <CardDescription>
                  Integrated calendar system with time slot management and automated reminders
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Digital visit notes, diagnoses, treatment plans, and comprehensive medical histories
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Activity className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Lab Results</CardTitle>
                <CardDescription>
                  Organized lab results with normal/abnormal flagging and trending analysis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Preventive Care</CardTitle>
                <CardDescription>
                  Immunization tracking, health screening reminders, and preventive care alerts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <HeartHandshake className="w-8 h-8 text-primary mb-4" />
                <CardTitle>Diet Planning</CardTitle>
                <CardDescription>
                  Collaborative meal planning with nutritional tracking and provider-patient communication
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* HIPAA Compliance Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">
              HIPAA Compliant & Secure
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Built with healthcare data security and privacy regulations in mind. 
              All patient information is encrypted and stored securely with comprehensive audit trails.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Data Encryption</h3>
                <p className="text-muted-foreground">End-to-end encryption for all patient data</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Access Controls</h3>
                <p className="text-muted-foreground">Role-based permissions and authentication</p>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">Audit Trails</h3>
                <p className="text-muted-foreground">Complete logging of all system activities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ikigai Wellness</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Ikigai Wellness. Built for healthcare professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
