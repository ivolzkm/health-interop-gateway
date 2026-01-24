import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Zap, BarChart3, Lock, FileJson } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-foreground">Health Interop Gateway</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                {user?.role === 'admin' && (
                  <Link href="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                )}
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Healthcare Data Integration Made Simple
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Transform proprietary healthcare data formats to HL7 FHIR R4 standard with security, compliance, and ease.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated && user?.role === 'admin' ? (
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg">Get Started</Button>
              </a>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <FileJson className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Smart Data Mapping</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically map proprietary data formats to HL7 FHIR R4 standard with configurable transformation rules.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Enterprise Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AES-256 encryption at rest and in transit, OAuth2 authentication, and comprehensive audit logging for LGPD compliance.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <CardTitle className="text-lg">Real-time Processing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Process healthcare messages instantly with validation feedback and error handling.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor integration status, message volume, processing times, and system health in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">Compliance Ready</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built for healthcare with LGPD compliance, audit trails, and data protection standards.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">FHIR Validation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatic validation against FHIR R4 standards with detailed error reporting and feedback.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border p-8 mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Receive Data</h4>
              <p className="text-sm text-muted-foreground">
                Healthcare systems send data via secure API with authentication
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Map & Transform</h4>
              <p className="text-sm text-muted-foreground">
                Data is transformed using configured mapping rules to FHIR format
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Validate</h4>
              <p className="text-sm text-muted-foreground">
                Transformed data is validated against FHIR R4 standards
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-blue-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Monitor</h4>
              <p className="text-sm text-muted-foreground">
                Track integration status and performance via the dashboard
              </p>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-lg border p-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">API Endpoints</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono text-sm font-semibold">POST /api/trpc/integration.receiveMessage</p>
              <p className="text-sm text-muted-foreground">
                Submit healthcare data for transformation and validation
              </p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono text-sm font-semibold">GET /api/trpc/integration.getMessageStatus</p>
              <p className="text-sm text-muted-foreground">
                Check the status and results of a submitted message
              </p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono text-sm font-semibold">GET /api/trpc/dashboard.*</p>
              <p className="text-sm text-muted-foreground">
                Access dashboard data (requires admin authentication)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Health Interoperability Gateway © 2026 - Built for healthcare data integration</p>
        </div>
      </footer>
    </div>
  );
}
