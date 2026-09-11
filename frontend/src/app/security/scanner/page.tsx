'use client';

import * as React from 'react';
import { QrCode, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, User, Calendar, MapPin } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/api-client';

interface ScanResult {
  _id: string;
  status: string;
  destination?: string;
  reason?: string;
  outDateTime?: string;
  expectedReturnDateTime?: string;
  usedAt?: string;
  studentId?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

export default function SecurityScannerPage() {
  const [tokenInput, setTokenInput] = React.useState('');
  const [gateId, setGateId] = React.useState('main-gate');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanSuccess, setScanSuccess] = React.useState<ScanResult | null>(null);
  const [scanError, setScanError] = React.useState<string | null>(null);

  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsScanning(true);
    setScanError(null);
    setScanSuccess(null);

    try {
      const response = await apiClient.request<ScanResult>('/gate-passes/scan', {
        method: 'POST',
        body: {
          token: tokenInput.trim(),
          gateId: gateId.trim() || 'main-gate',
        },
      });

      setScanSuccess(response);
      setTokenInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify gate pass token.';
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setScanSuccess(null);
    setScanError(null);
    setTokenInput('');
  };

  return (
    <ProtectedRoute allowedRoles={['security', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Security Gate Scanner & Token Verification"
          subheading="Scan student QR tokens or enter opaque pass codes to verify exit clearance."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scanner Input Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pass Token Verification</span>
              </CardTitle>
              <CardDescription className="text-xs">
                All pass validations are checked directly against backend token hashes for security.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleVerifyPass} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="tokenInput" className="text-xs font-semibold text-foreground">
                    Pass Token String / QR Payload
                  </label>
                  <Input
                    id="tokenInput"
                    placeholder="Enter or scan pass token..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="font-mono text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="gateIdInput" className="text-xs font-semibold text-foreground">
                    Gate Identifier
                  </label>
                  <Input
                    id="gateIdInput"
                    placeholder="e.g. main-gate, hostel-gate-1"
                    value={gateId}
                    onChange={(e) => setGateId(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="emerald"
                    disabled={isScanning || !tokenInput.trim()}
                    className="w-full"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify Gate Pass
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Verification Status & Details Panel */}
          <div>
            {scanSuccess ? (
              <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>Pass Verified — Exit Authorized</span>
                    </CardTitle>
                    <Badge variant="success">USED / RECORDED</Badge>
                  </div>
                  <CardDescription className="text-xs text-emerald-800 dark:text-emerald-400">
                    Exit timestamp recorded at {gateId}.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  {scanSuccess.studentId?.name && (
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Student: {scanSuccess.studentId.name}</span>
                      {scanSuccess.studentId.email && (
                        <span className="text-muted-foreground font-normal">({scanSuccess.studentId.email})</span>
                      )}
                    </div>
                  )}

                  {scanSuccess.destination && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Destination: <strong className="text-foreground">{scanSuccess.destination}</strong></span>
                    </div>
                  )}

                  {scanSuccess.outDateTime && (
                    <div className="flex items-center gap-2 text-muted-foreground font-mono">
                      <Calendar className="h-4 w-4" />
                      <span>Approved Out: {new Date(scanSuccess.outDateTime).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3">
                    <Button variant="outline" size="sm" onClick={resetScanner} className="w-full">
                      Scan Next Token
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : scanError ? (
              <Card className="border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                      <span>Verification Failed</span>
                    </CardTitle>
                    <Badge variant="danger">REJECTED</Badge>
                  </div>
                  <CardDescription className="text-xs text-rose-800 dark:text-rose-400">
                    Backend verification authority rejected the provided pass token.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <div className="rounded-md bg-rose-100 p-3 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200 font-mono text-xs">
                    {scanError}
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={resetScanner} className="w-full">
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <h4 className="text-sm font-semibold text-foreground">Awaiting Scan</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Scan a QR code payload or enter an 8+ character token string to verify campus exit authorization.
                </p>
              </Card>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
