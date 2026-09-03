# Nango Custom Functions: Snyk & Socket.dev for AmbiOS AI

**Implementation Guide for Building Custom Functions**

**Last Updated:** August 31, 2026

**Guide status:** `BLOCKED` — the examples are not deployment evidence. Snyk: `BLOCKED`; Socket.dev: `BLOCKED`. Set either field to `PASS` only after an authenticated provider-side result and corresponding AmbiOS audit evidence; set it to `FAIL` when an attempted check does not meet the requirement.

---

## Current implementation boundary (August 31, 2026)

AmbiOS currently uses a manually curated, typed feature map for supported
vendor tools plus read-only server-side feature discovery. User connections
remain account-scoped metadata records; credentials are handled by the
server-side connector boundary and are never sent to browser tool handlers.

The Nango CLI project, custom sync/action/on-event scaffolding, and provider
endpoints shown later are implementation options, not proof that those
functions are deployed. Snyk scan/fix and Socket report/malware operations are
explicitly unavailable until their exact authenticated APIs and approval
semantics are verified. Do not expose a tool merely because it appears in an
example or a provider catalog.

## Overview

This guide shows how to build **custom Nango functions** for **Snyk** and **Socket.dev** security integrations in AmbiOS AI. These functions will be exposed as **WebMCP tools** for AI agents to call.

**Function Types:**
- **Actions** - Run on-demand operations (scan project, analyze package, apply fix)
- **Syncs** - Periodically fetch data (vulnerability reports, risk scores)
- **On-Events** - React to webhooks (new vulnerability detected, malware found)

---

## 1. Setup Nango Development Environment

### 1.1 Install Nango CLI

```bash
npm install -g nango
```

### 1.2 Initialize Nango Integrations

```bash
# From your AmbiOS repo root
nango init nango-integrations
```

This creates:
```
nango-integrations/
├── providers.yaml          # Provider configurations
├── index.ts              # Function imports
├── package.json
├── tsconfig.json
├── snyk/                 # Snyk integration folder
│   ├── syncs/
│   ├── actions/
│   └── on-events/
└── socket/               # Socket.dev integration folder
    ├── syncs/
    ├── actions/
    └── on-events/
```

### 1.3 Configure API Keys

Create `.env` in `nango-integrations/`:

```bash
# .env
NANGO_SECRET_KEY_DEV='your_nango_secret_key_dev'
NANGO_SECRET_KEY_PROD='your_nango_secret_key_prod'

# Snyk credentials for testing are supplied by the user's Nango connection.
# Do not add a SNYK_API_TOKEN or organization-wide Snyk secret to AmbiOS.

# Socket.dev credentials for testing are supplied by the user's Nango connection.
# Do not add a SOCKET_API_TOKEN or shared project secret to AmbiOS.
```

Get Nango API keys from: **Dashboard > Environment Settings > API Keys**

---

## 2. Snyk Integration Functions

### 2.1 Folder Structure

```
nango-integrations/snyk/
├── actions/
│   ├── scan_project.ts        # Scan project for vulnerabilities
│   ├── get_vulnerabilities.ts # Get vulnerability details
│   ├── suggest_fix.ts         # Suggest remediation
│   └── apply_fix.ts           # Apply fix (upgrade dependency)
├── syncs/
│   ├── vulnerability_report.ts  # Sync vulnerability data
│   └── dependency_tree.ts       # Sync dependency tree
└── on-events/
    └── new_vulnerability.ts     # React to new vulnerability webhook
```

### 2.2 Action Functions

#### `scan_project.ts`

```typescript
// nango-integrations/snyk/actions/scan_project.ts

import type { NangoAction, SnykProjectScanInput, SnykProjectScanOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SnykProjectScanInput): Promise<SnykProjectScanOutput> {
  const { projectId, scanType } = input;
  
  try {
    // Trigger Snyk scan via API
    const scanResponse = await nango.get({
      endpoint: `/org/${nango.getConnection().connection_config?.orgId}/project/${projectId}/scan`,
      params: {
        scanType, // 'dependencies' | 'code' | 'container' | 'iac'
      },
    });
    
    if (!scanResponse || !scanResponse.data) {
      throw new Error('Failed to trigger Snyk scan');
    }
    
    const scanId = scanResponse.data.id;
    
    // Poll for scan completion (max 5 minutes)
    let scanStatus = 'pending';
    let result = null;
    const maxAttempts = 30;
    const pollInterval = 10000; // 10 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusResponse = await nango.get({
        endpoint: `/org/${nango.getConnection().connection_config?.orgId}/scan/${scanId}/status`,
      });
      
      scanStatus = statusResponse.data.status;
      
      if (scanStatus === 'complete') {
        result = statusResponse.data.result;
        break;
      } else if (scanStatus === 'failed') {
        throw new Error(`Snyk scan failed: ${statusResponse.data.error}`);
      }
    }
    
    if (!result) {
      throw new Error('Snyk scan timed out');
    }
    
    // Log action for audit trail
    await nango.log(`Snyk scan completed for project ${projectId}`, {
      scanType,
      scanId,
      vulnerabilitiesFound: result.vulnerabilities?.length || 0,
    });
    
    return {
      success: true,
      scanId,
      projectId,
      scanType,
      vulnerabilities: result.vulnerabilities || [],
      licenses: result.licenses || [],
      dependencies: result.dependencies || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Snyk scan failed: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      projectId,
      scanType,
    };
  }
}
```

#### `get_vulnerabilities.ts`

```typescript
// nango-integrations/snyk/actions/get_vulnerabilities.ts

import type { NangoAction, SnykVulnerabilitiesInput, SnykVulnerabilitiesOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SnykVulnerabilitiesInput): Promise<SnykVulnerabilitiesOutput> {
  const { projectId, severity, packageFilter } = input;
  
  try {
    const response = await nango.get({
      endpoint: `/org/${nango.getConnection().connection_config?.orgId}/project/${projectId}/vulnerabilities`,
      params: {
        severity, // 'low' | 'medium' | 'high' | 'critical'
        package: packageFilter,
      },
    });
    
    if (!response || !response.data) {
      throw new Error('Failed to fetch vulnerabilities');
    }
    
    const vulnerabilities = response.data.vulnerabilities || [];
    
    // Filter by severity if specified
    const filteredVulnerabilities = severity
      ? vulnerabilities.filter((v: any) => v.severity === severity)
      : vulnerabilities;
    
    return {
      success: true,
      projectId,
      vulnerabilities: filteredVulnerabilities.map((v: any) => ({
        id: v.id,
        package: v.package,
        version: v.version,
        severity: v.severity,
        description: v.description,
        cvssScore: v.cvssScore,
        exploitMaturity: v.exploitMaturity,
        isFixable: v.isFixable,
        fixVersion: v.fixVersion,
      })),
      totalCount: filteredVulnerabilities.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Failed to fetch vulnerabilities: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      projectId,
    };
  }
}
```

#### `suggest_fix.ts`

```typescript
// nango-integrations/snyk/actions/suggest_fix.ts

import type { NangoAction, SnykFixSuggestionInput, SnykFixSuggestionOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SnykFixSuggestionInput): Promise<SnykFixSuggestionOutput> {
  const { vulnerabilityId, projectId } = input;
  
  try {
    const response = await nango.get({
      endpoint: `/org/${nango.getConnection().connection_config?.orgId}/vulnerability/${vulnerabilityId}/fix`,
    });
    
    if (!response || !response.data) {
      throw new Error('Failed to fetch fix suggestion');
    }
    
    const fix = response.data;
    
    return {
      success: true,
      vulnerabilityId,
      projectId,
      fix: {
        type: fix.type, // 'upgrade' | 'patch' | 'replace'
        description: fix.description,
        changes: fix.changes.map((c: any) => ({
          package: c.package,
          fromVersion: c.fromVersion,
          toVersion: c.toVersion,
        })),
        riskLevel: fix.riskLevel, // 'low' | 'medium' | 'high'
        breakingChanges: fix.breakingChanges || false,
        estimatedEffort: fix.estimatedEffort, // 'minutes' | 'hours'
        rollbackAvailable: fix.rollbackAvailable || true,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Failed to fetch fix suggestion: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      vulnerabilityId,
    };
  }
}
```

#### `apply_fix.ts`

```typescript
// nango-integrations/snyk/actions/apply_fix.ts

import type { NangoAction, SnykApplyFixInput, SnykApplyFixOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SnykApplyFixInput): Promise<SnykApplyFixOutput> {
  const { vulnerabilityId, projectId, approvalToken } = input;
  
  try {
    // Verify approval token (for high-risk fixes)
    if (!approvalToken) {
      throw new Error('Approval token required for applying fix');
    }
    
    // Get fix details first
    const fixResponse = await nango.get({
      endpoint: `/org/${nango.getConnection().connection_config?.orgId}/vulnerability/${vulnerabilityId}/fix`,
    });
    
    const fix = fixResponse.data;
    
    // Apply fix via Snyk API
    const applyResponse = await nango.post({
      endpoint: `/org/${nango.getConnection().connection_config?.orgId}/project/${projectId}/fix`,
      data: {
        vulnerabilityId,
        fixType: fix.type,
        changes: fix.changes,
        approvalToken,
      },
    });
    
    if (!applyResponse || !applyResponse.data) {
      throw new Error('Failed to apply fix');
    }
    
    const result = applyResponse.data;
    
    // Log for audit trail
    await nango.log(`Snyk fix applied for vulnerability ${vulnerabilityId}`, {
      projectId,
      fixType: fix.type,
      prUrl: result.prUrl,
      commitSha: result.commitSha,
    });
    
    return {
      success: true,
      vulnerabilityId,
      projectId,
      fixApplied: true,
      prUrl: result.prUrl,
      commitSha: result.commitSha,
      rollbackAvailable: result.rollbackAvailable || true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Failed to apply fix: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      vulnerabilityId,
    };
  }
}
```

### 2.3 Sync Functions

#### `vulnerability_report.ts`

```typescript
// nango-integrations/snyk/syncs/vulnerability_report.ts

import type { NangoSync, SnykVulnerabilityReport } from '../../models';

export default async function fetchData(nango: NangoSync) {
  const connection = nango.getConnection();
  const orgId = connection.connection_config?.orgId;
  
  try {
    // Get all projects for this org
    const projectsResponse = await nango.get({
      endpoint: `/org/${orgId}/projects`,
    });
    
    const projects = projectsResponse.data.projects || [];
    
    // Fetch vulnerabilities for each project
    for (const project of projects) {
      const vulnResponse = await nango.get({
        endpoint: `/org/${orgId}/project/${project.id}/vulnerabilities`,
      });
      
      const vulnerabilities = vulnResponse.data.vulnerabilities || [];
      
      // Save to Nango sync database
      await nango.batchSave(
        vulnerabilities.map((v: any) => ({
          project_id: project.id,
          project_name: project.name,
          vulnerability_id: v.id,
          package: v.package,
          version: v.version,
          severity: v.severity,
          description: v.description,
          cvss_score: v.cvssScore,
          is_fixable: v.isFixable,
          fix_version: v.fixVersion,
          discovered_at: v.discoveredAt,
        })),
        'snyk_vulnerabilities'
      );
      
      // Report progress
      await nango.log(`Synced ${vulnerabilities.length} vulnerabilities for project ${project.name}`);
    }
    
    await nango.log('Snyk vulnerability report sync completed');
  } catch (error) {
    await nango.log(`Snyk sync failed: ${error.message}`, { level: 'error' });
    throw error;
  }
}
```

### 2.4 On-Event Functions

#### `new_vulnerability.ts`

```typescript
// nango-integrations/snyk/on-events/new_vulnerability.ts

import type { NangoOnEvent, SnykVulnerabilityWebhook } from '../../models';

export default async function onEvent(nango: NangoOnEvent, payload: SnykVulnerabilityWebhook) {
  const { orgId, projectId, vulnerability } = payload;
  
  try {
    // Log new vulnerability detection
    await nango.log(`New vulnerability detected: ${vulnerability.id}`, {
      orgId,
      projectId,
      severity: vulnerability.severity,
      package: vulnerability.package,
    });
    
    // Trigger immediate scan to get full context
    const scanResult = await nango.triggerAction({
      connectionId: nango.getConnectionId(),
      providerConfigKey: 'snyk',
      actionName: 'scan_project',
      input: {
        projectId,
        scanType: 'dependencies',
      },
    });
    
    // If critical/high severity, notify team
    if (['critical', 'high'].includes(vulnerability.severity)) {
      await nango.triggerAction({
        connectionId: nango.getConnectionId(),
        providerConfigKey: 'slack',
        actionName: 'send_message',
        input: {
          channel: '#security-alerts',
          message: `🚨 Critical vulnerability detected in ${vulnerability.package}@${vulnerability.version}\nSeverity: ${vulnerability.severity}\nProject: ${projectId}`,
        },
      });
    }
    
    await nango.log('New vulnerability event processed successfully');
  } catch (error) {
    await nango.log(`Failed to process new vulnerability event: ${error.message}`, { level: 'error' });
    throw error;
  }
}
```

---

## 3. Socket.dev Integration Functions

### 3.1 Folder Structure

```
nango-integrations/socket/
├── actions/
│   ├── analyze_package.ts       # Analyze npm package
│   ├── get_supply_chain_report.ts # Get supply chain report
│   ├── detect_malware.ts        # Check for malware
│   └── get_risk_score.ts        # Get risk score for project
├── syncs/
│   ├── package_analysis.ts      # Sync package analysis data
│   └── risk_scores.ts           # Sync risk scores
└── on-events/
    └── malware_detected.ts      # React to malware detection webhook
```

### 3.2 Action Functions

#### `analyze_package.ts`

```typescript
// nango-integrations/socket/actions/analyze_package.ts

import type { NangoAction, SocketPackageAnalysisInput, SocketPackageAnalysisOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SocketPackageAnalysisInput): Promise<SocketPackageAnalysisOutput> {
  const { packageName, version } = input;
  
  try {
    // Call Socket.dev API to analyze package
    const response = await nango.get({
      endpoint: '/v1/analyze',
      params: {
        package: packageName,
        version: version || 'latest',
      },
    });
    
    if (!response || !response.data) {
      throw new Error('Failed to analyze package');
    }
    
    const analysis = response.data;
    
    return {
      success: true,
      packageName,
      version: analysis.version,
      analysis: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel, // 'low' | 'medium' | 'high' | 'critical'
        issues: analysis.issues.map((issue: any) => ({
          type: issue.type,
          severity: issue.severity,
          description: issue.description,
          file: issue.file,
          line: issue.line,
        })),
        supplyChain: {
          hasLockfile: analysis.supplyChain.hasLockfile,
          hasSbom: analysis.supplyChain.hasSbom,
          dependencyDepth: analysis.supplyChain.dependencyDepth,
          transitiveDependencies: analysis.supplyChain.transitiveDependencies,
        },
        malware: {
          isClean: analysis.malware.isClean,
          suspiciousBehaviors: analysis.malware.suspiciousBehaviors || [],
        },
        licenses: analysis.licenses,
        maintainer: {
          trustScore: analysis.maintainer.trustScore,
          accountAge: analysis.maintainer.accountAge,
          otherPackages: analysis.maintainer.otherPackages,
        },
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Failed to analyze package ${packageName}: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      packageName,
    };
  }
}
```

#### `get_supply_chain_report.ts`

```typescript
// nango-integrations/socket/actions/get_supply_chain_report.ts

import type { NangoAction, SocketSupplyChainReportInput, SocketSupplyChainReportOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SocketSupplyChainReportInput): Promise<SocketSupplyChainReportOutput> {
  const { projectId } = input;
  
  try {
    const response = await nango.get({
      endpoint: `/v1/report/${projectId}`,
    });
    
    if (!response || !response.data) {
      throw new Error('Failed to fetch supply chain report');
    }
    
    const report = response.data;
    
    return {
      success: true,
      projectId,
      report: {
        overallRiskScore: report.overallRiskScore,
        overallRiskLevel: report.overallRiskLevel,
        packages: report.packages.map((pkg: any) => ({
          name: pkg.name,
          version: pkg.version,
          riskScore: pkg.riskScore,
          issues: pkg.issues,
        })),
        criticalIssues: report.criticalIssues,
        recommendations: report.recommendations,
        complianceStatus: report.complianceStatus,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Failed to fetch supply chain report: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      projectId,
    };
  }
}
```

#### `detect_malware.ts`

```typescript
// nango-integrations/socket/actions/detect_malware.ts

import type { NangoAction, SocketMalwareDetectionInput, SocketMalwareDetectionOutput } from '../../models';

export default async function runAction(nango: NangoAction, input: SocketMalwareDetectionInput): Promise<SocketMalwareDetectionOutput> {
  const { packageName } = input;
  
  try {
    const response = await nango.get({
      endpoint: '/v1/malware',
      params: {
        package: packageName,
      },
    });
    
    if (!response || !response.data) {
      throw new Error('Failed to check for malware');
    }
    
    const malware = response.data;
    
    return {
      success: true,
      packageName,
      malware: {
        isClean: malware.isClean,
        isMalware: malware.isMalware,
        suspiciousBehaviors: malware.suspiciousBehaviors || [],
        malwareFamily: malware.malwareFamily,
        firstSeen: malware.firstSeen,
        lastSeen: malware.lastSeen,
        affectedVersions: malware.affectedVersions || [],
      },
      recommendation: malware.isMalware
        ? `⚠️ DO NOT USE: ${packageName} is confirmed malware. Remove immediately.`
        : malware.suspiciousBehaviors?.length
        ? `⚠️ CAUTION: ${packageName} has suspicious behaviors. Review before using.`
        : `✅ ${packageName} appears clean.`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await nango.log(`Failed to check malware for ${packageName}: ${error.message}`, { level: 'error' });
    
    return {
      success: false,
      error: error.message,
      packageName,
    };
  }
}
```

---

## 4. Type Definitions (models.ts)

```typescript
// nango-integrations/models.ts

// Snyk Types

export interface SnykProjectScanInput {
  projectId: string;
  scanType: 'dependencies' | 'code' | 'container' | 'iac';
}

export interface SnykProjectScanOutput {
  success: boolean;
  scanId?: string;
  projectId: string;
  scanType: string;
  vulnerabilities?: any[];
  licenses?: any[];
  dependencies?: any[];
  error?: string;
  timestamp: string;
}

export interface SnykVulnerabilitiesInput {
  projectId: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  packageFilter?: string;
}

export interface SnykVulnerabilitiesOutput {
  success: boolean;
  projectId: string;
  vulnerabilities?: Array<{
    id: string;
    package: string;
    version: string;
    severity: string;
    description: string;
    cvssScore: number;
    exploitMaturity: string;
    isFixable: boolean;
    fixVersion?: string;
  }>;
  totalCount?: number;
  error?: string;
  timestamp: string;
}

export interface SnykFixSuggestionInput {
  vulnerabilityId: string;
  projectId?: string;
}

export interface SnykFixSuggestionOutput {
  success: boolean;
  vulnerabilityId: string;
  fix?: {
    type: 'upgrade' | 'patch' | 'replace';
    description: string;
    changes: Array<{
      package: string;
      fromVersion: string;
      toVersion: string;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    breakingChanges: boolean;
    estimatedEffort: 'minutes' | 'hours';
    rollbackAvailable: boolean;
  };
  error?: string;
  timestamp: string;
}

export interface SnykApplyFixInput {
  vulnerabilityId: string;
  projectId: string;
  approvalToken: string;
}

export interface SnykApplyFixOutput {
  success: boolean;
  vulnerabilityId: string;
  fixApplied?: boolean;
  prUrl?: string;
  commitSha?: string;
  rollbackAvailable?: boolean;
  error?: string;
  timestamp: string;
}

// Socket Types

export interface SocketPackageAnalysisInput {
  packageName: string;
  version?: string;
}

export interface SocketPackageAnalysisOutput {
  success: boolean;
  packageName: string;
  version?: string;
  analysis?: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    issues: Array<{
      type: string;
      severity: string;
      description: string;
      file?: string;
      line?: number;
    }>;
    supplyChain: {
      hasLockfile: boolean;
      hasSbom: boolean;
      dependencyDepth: number;
      transitiveDependencies: number;
    };
    malware: {
      isClean: boolean;
      suspiciousBehaviors?: string[];
    };
    licenses: string[];
    maintainer: {
      trustScore: number;
      accountAge: number;
      otherPackages: number;
    };
  };
  error?: string;
  timestamp: string;
}

export interface SocketSupplyChainReportInput {
  projectId: string;
}

export interface SocketSupplyChainReportOutput {
  success: boolean;
  projectId: string;
  report?: {
    overallRiskScore: number;
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    packages: Array<{
      name: string;
      version: string;
      riskScore: number;
      issues: any[];
    }>;
    criticalIssues: any[];
    recommendations: string[];
    complianceStatus: 'compliant' | 'non-compliant' | 'unknown';
  };
  error?: string;
  timestamp: string;
}

export interface SocketMalwareDetectionInput {
  packageName: string;
}

export interface SocketMalwareDetectionOutput {
  success: boolean;
  packageName: string;
  malware?: {
    isClean: boolean;
    isMalware: boolean;
    suspiciousBehaviors?: string[];
    malwareFamily?: string;
    firstSeen?: string;
    lastSeen?: string;
    affectedVersions?: string[];
  };
  recommendation?: string;
  error?: string;
  timestamp: string;
}
```

---

## 5. Root Index File

```typescript
// nango-integrations/index.ts

// Snyk Actions
import scanProject from './snyk/actions/scan_project';
import getVulnerabilities from './snyk/actions/get_vulnerabilities';
import suggestFix from './snyk/actions/suggest_fix';
import applyFix from './snyk/actions/apply_fix';

// Snyk Syncs
import vulnerabilityReport from './snyk/syncs/vulnerability_report';

// Snyk On-Events
import newVulnerability from './snyk/on-events/new_vulnerability';

// Socket Actions
import analyzePackage from './socket/actions/analyze_package';
import getSupplyChainReport from './socket/actions/get_supply_chain_report';
import detectMalware from './socket/actions/detect_malware';

// Socket Syncs
import packageAnalysis from './socket/syncs/package_analysis';

// Socket On-Events
import malwareDetected from './socket/on-events/malware_detected';

// Export all functions
export {
  // Snyk Actions
  scanProject,
  getVulnerabilities,
  suggestFix,
  applyFix,
  
  // Snyk Syncs
  vulnerabilityReport,
  
  // Snyk On-Events
  newVulnerability,
  
  // Socket Actions
  analyzePackage,
  getSupplyChainReport,
  detectMalware,
  
  // Socket Syncs
  packageAnalysis,
  
  // Socket On-Events
  malwareDetected,
};
```

---

## 6. Development & Testing

### 6.1 Start Development Server

```bash
cd nango-integrations
nango dev
```

This starts a local dev server at `http://localhost:3003`.

### 6.2 Test Actions with Dryrun

```bash
# Test Snyk scan_project action
nango dryrun scan_project snyk_connection_123 -e dev

# Test with input
nango dryrun scan_project snyk_connection_123 -e dev --input '{"projectId": "abc123", "scanType": "dependencies"}'

# Test Socket analyze_package action
nango dryrun analyze_package socket_connection_456 -e dev --input '{"packageName": "lodash", "version": "4.17.20"}'
```

### 6.3 Test Syncs

```bash
# Trigger sync manually
nango sync snyk_connection_123 vulnerability_report -e dev
```

### 6.4 Deploy to Production

```bash
# Deploy Snyk actions
nango deploy --action scan_project dev
nango deploy --action get_vulnerabilities dev
nango deploy --action suggest_fix dev
nango deploy --action apply_fix dev

# Deploy Snyk syncs
nango deploy --sync vulnerability_report dev

# Deploy Socket actions
nango deploy --action analyze_package dev
nango deploy --action get_supply_chain_report dev
nango deploy --action detect_malware dev

# Deploy Socket syncs
nango deploy --sync package_analysis dev
```

---

## 7. WebMCP Integration

### 7.1 Register Nango Actions as WebMCP Tools

```typescript
// lib/webmcp/tools/nango.ts

import { useWebMCPTool } from '@mcp-b/react-webmcp';

export function useSnykScanProjectTool() {
  return useWebMCPTool({
    name: 'snyk.scan_project',
    description: 'Runs a security scan on a Snyk project and returns vulnerabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The Snyk project ID to scan.',
        },
        scanType: {
          type: 'string',
          enum: ['dependencies', 'code', 'container', 'iac'],
          description: 'Type of security scan to run.',
        },
      },
      required: ['projectId', 'scanType'],
    },
    execute: async ({ projectId, scanType }) => {
      // Call Nango action API
      const response = await fetch('/api/nango/actions/scan_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: 'snyk_connection_123',
          providerConfigKey: 'snyk',
          actionName: 'scan_project',
          input: { projectId, scanType },
        }),
      });
      
      const result = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: result.success
              ? `✅ Scan completed. Found ${result.vulnerabilities?.length || 0} vulnerabilities.`
              : `❌ Scan failed: ${result.error}`,
          },
        ],
      };
    },
  });
}

export function useSocketAnalyzePackageTool() {
  return useWebMCPTool({
    name: 'socket.analyze_package',
    description: 'Analyzes an npm package for supply chain risks and returns risk score.',
    inputSchema: {
      type: 'object',
      properties: {
        packageName: {
          type: 'string',
          description: 'The npm package name to analyze (e.g., "lodash").',
        },
        version: {
          type: 'string',
          description: 'The package version to analyze.',
        },
      },
      required: ['packageName'],
    },
    execute: async ({ packageName, version }) => {
      const response = await fetch('/api/nango/actions/analyze_package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: 'socket_connection_456',
          providerConfigKey: 'socket',
          actionName: 'analyze_package',
          input: { packageName, version },
        }),
      });
      
      const result = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: result.success
              ? `✅ Analysis complete. Risk score: ${result.analysis?.riskScore}/100 (${result.analysis?.riskLevel})`
              : `❌ Analysis failed: ${result.error}`,
          },
        ],
      };
    },
  });
}
```

### 7.2 Nango Action API Route

```typescript
// app/api/nango/actions/[actionName]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY!,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { actionName: string } }
) {
  const { actionName } = params;
  const { connectionId, providerConfigKey, input } = await request.json();
  
  try {
    // Trigger Nango action
    const result = await nango.triggerAction({
      connectionId,
      providerConfigKey,
      actionName,
      input,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Nango action ${actionName} failed:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 8. Testing Checklist

### Snyk Functions

- [ ] `scan_project` - Triggers scan, polls for completion, returns vulnerabilities
- [ ] `get_vulnerabilities` - Filters by severity, returns detailed info
- [ ] `suggest_fix` - Returns upgrade/patch/replace recommendations
- [ ] `apply_fix` - Creates PR, requires approval token, logs audit trail
- [ ] `vulnerability_report` sync - Fetches all projects, saves to Nango DB
- [ ] `new_vulnerability` on-event - Triggers on webhook, sends Slack alert

### Socket Functions

- [ ] `analyze_package` - Returns risk score, issues, supply chain info
- [ ] `get_supply_chain_report` - Returns project-wide report
- [ ] `detect_malware` - Checks for malware, returns recommendation
- [ ] `package_analysis` sync - Analyzes all packages, saves to Nango DB
- [ ] `malware_detected` on-event - Triggers on webhook, sends alert

### WebMCP Integration

- [ ] Tools registered with correct names (`snyk.*`, `socket.*`)
- [ ] Input schemas match Nango action input types
- [ ] Error handling returns proper WebMCP format
- [ ] Audit logging works for all actions
- [ ] Approval gates trigger for high-risk actions

---

## 9. Security Considerations

### Token Management

- Store Nango API keys in environment variables (never in code)
- Use separate keys for dev and prod
- Rotate keys periodically

### Approval Tokens

- Generate unique tokens for each approval request
- Store tokens in D1 with expiration (e.g., 1 hour)
- Verify token before executing high-risk actions

### Audit Logging

- Log all action executions with timestamps
- Include user ID, agent ID, and IP address
- Store logs in D1 for compliance

### Rate Limiting

- Implement rate limiting on Nango action API routes
- Respect Snyk/Socket API rate limits
- Queue actions if rate limit exceeded

---

## 10. Next Steps

1. **Set up Nango dev environment** (install CLI, init integrations)
2. **Write Snyk functions** (actions, syncs, on-events)
3. **Write Socket functions** (actions, syncs, on-events)
4. **Test with dryrun** (verify each function works)
5. **Deploy to Nango** (deploy actions and syncs)
6. **Integrate with WebMCP** (register as tools)
7. **Test end-to-end** (agent calls tool → Nango action → Snyk/Socket API)
8. **Add approval gates** (for high-risk actions)
9. **Add audit logging** (log all actions)
10. **Deploy to production**

---

**This guide follows Nango's recommended workflow: Option 2 (Build locally with CLI) for custom integrations without templates.**
