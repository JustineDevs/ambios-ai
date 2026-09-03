# Vendor Features, Permissions & Capabilities for AmbiOS AI

**Comprehensive Feature Mapping for All Integrated Vendors**

**Last Updated:** August 31, 2026

**Evidence status:** `BLOCKED` — this is a capability and permission map, not proof that vendors are connected. Use `PASS`, `BLOCKED`, or `FAIL` per vendor after direct evidence; Snyk: `BLOCKED`; Socket.dev: `BLOCKED` pending authenticated provider results and audit records.

---

## Table of Contents

1. [Cloudflare](#1-cloudflare)
2. [Vercel](#2-vercel)
3. [GitHub](#3-github)
4. [Snyk](#4-snyk)
5. [Socket.dev](#5-socketdev)
6. [Notion](#6-notion)
7. [Shopify](#7-shopify)
8. [Slack](#8-slack)
9. [Jira](#9-jira)
10. [Linear](#10-linear)
11. [Datadog](#11-datadog)
12. [AWS](#12-aws)
13. [Google Cloud](#13-google-cloud)
14. [Nango](#14-nango)

---

## 1. Cloudflare

### 1.1 OAuth Scopes Required

```
worker:read       - Read Worker code, configurations, and metadata
worker:write      - Deploy, update, and delete Workers
worker:logs:read  - Access Worker logs and analytics
analytics:read    - Read analytics and metrics
dns:read          - Read DNS records
dns:write         - Update DNS records
zones:read        - Read zone information
```

### 1.2 Features & Capabilities

#### **Worker Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Workers | `worker:read` | `cloudflare.list_workers` | Get all Workers in account |
| Get Worker Code | `worker:read` | `cloudflare.get_worker_code` | Fetch Worker source code |
| Deploy Worker | `worker:write` | `cloudflare.deploy_worker` | Deploy new Worker version |
| Rollback Worker | `worker:write` | `cloudflare.rollback_worker` | Rollback to previous version |
| Delete Worker | `worker:write` | `cloudflare.delete_worker` | Delete Worker (requires approval) |
| Get Worker Logs | `worker:logs:read` | `cloudflare.get_worker_logs` | Fetch recent logs |
| Get Worker Analytics | `analytics:read` | `cloudflare.get_worker_analytics` | Get performance metrics |
| Get Worker Bindings | `worker:read` | `cloudflare.get_worker_bindings` | List D1, KV, R2 bindings |
| Update Worker Env Vars | `worker:write` | `cloudflare.update_worker_env` | Update environment variables |

#### **D1 Database**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List D1 Databases | `worker:read` | `cloudflare.list_d1_databases` | Get all D1 databases |
| Query D1 | `worker:write` | `cloudflare.query_d1` | Execute SQL queries |
| Get D1 Metrics | `analytics:read` | `cloudflare.get_d1_metrics` | Get query performance |

#### **KV Storage**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List KV Namespaces | `worker:read` | `cloudflare.list_kv_namespaces` | Get all KV namespaces |
| Get KV Value | `worker:read` | `cloudflare.get_kv_value` | Retrieve value from KV |
| Put KV Value | `worker:write` | `cloudflare.put_kv_value` | Store value in KV |
| Delete KV Value | `worker:write` | `cloudflare.delete_kv_value` | Remove value from KV |
| List KV Keys | `worker:read` | `cloudflare.list_kv_keys` | List keys in namespace |

#### **R2 Storage**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List R2 Buckets | `worker:read` | `cloudflare.list_r2_buckets` | Get all R2 buckets |
| Upload to R2 | `worker:write` | `cloudflare.upload_r2` | Upload file to bucket |
| Download from R2 | `worker:read` | `cloudflare.download_r2` | Download file from bucket |
| Delete from R2 | `worker:write` | `cloudflare.delete_r2` | Delete file from bucket |
| List R2 Objects | `worker:read` | `cloudflare.list_r2_objects` | List objects in bucket |

#### **DNS Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List DNS Records | `dns:read` | `cloudflare.list_dns_records` | Get DNS records for zone |
| Create DNS Record | `dns:write` | `cloudflare.create_dns_record` | Add new DNS record |
| Update DNS Record | `dns:write` | `cloudflare.update_dns_record` | Modify DNS record |
| Delete DNS Record | `dns:write` | `cloudflare.delete_dns_record` | Remove DNS record |

#### **Analytics & Monitoring**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Worker Metrics | `analytics:read` | `cloudflare.get_worker_metrics` | CPU time, requests, errors |
| Get Error Logs | `worker:logs:read` | `cloudflare.get_error_logs` | Fetch error logs |
| Get Performance Insights | `analytics:read` | `cloudflare.get_performance_insights` | Cold starts, latency |

### 1.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Deploy Worker (staging) | Low | No | Auto-deploy allowed |
| Deploy Worker (production) | High | Yes | Requires human approval |
| Rollback Worker | Medium | Yes | Production rollbacks need approval |
| Delete Worker | Critical | Yes | Requires org admin approval |
| Update DNS Records | High | Yes | DNS changes need approval |
| Delete D1 Data | Critical | Yes | Data deletion requires approval |

### 1.4 Audit Logging

All actions logged to D1:
- Timestamp
- User ID
- Agent ID
- Action type
- Worker name
- Environment (staging/production)
- Result (success/failure)
- Duration

---

## 2. Vercel

### 2.1 OAuth Scopes Required

```
deployments:read    - Read deployment status and logs
deployments:write   - Create and manage deployments
projects:read       - Read project configurations
projects:write      - Update project settings
env:read            - Read environment variables
env:write           - Update environment variables
```

### 2.2 Features & Capabilities

#### **Deployment Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Deployments | `deployments:read` | `vercel.list_deployments` | Get all deployments for project |
| Get Deployment Status | `deployments:read` | `vercel.get_deployment_status` | Check deployment state |
| Trigger Deployment | `deployments:write` | `vercel.trigger_deployment` | Start new deployment |
| Cancel Deployment | `deployments:write` | `vercel.cancel_deployment` | Cancel in-progress deployment |
| Rollback Deployment | `deployments:write` | `vercel.rollback_deployment` | Rollback to previous version |
| Get Deployment Logs | `deployments:read` | `vercel.get_deployment_logs` | Fetch build logs |
| Get Deployment URL | `deployments:read` | `vercel.get_deployment_url` | Get preview/production URL |

#### **Project Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Projects | `projects:read` | `vercel.list_projects` | Get all projects |
| Get Project Config | `projects:read` | `vercel.get_project_config` | Fetch project settings |
| Update Project Config | `projects:write` | `vercel.update_project_config` | Modify settings |
| Get Project Domains | `projects:read` | `vercel.get_project_domains` | List custom domains |

#### **Environment Variables**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Env Vars | `env:read` | `vercel.list_env_vars` | Get environment variables |
| Create Env Var | `env:write` | `vercel.create_env_var` | Add new env var |
| Update Env Var | `env:write` | `vercel.update_env_var` | Modify env var |
| Delete Env Var | `env:write` | `vercel.delete_env_var` | Remove env var |

#### **Analytics & Insights**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Web Vitals | `deployments:read` | `vercel.get_web_vitals` | Performance metrics |
| Get Analytics | `deployments:read` | `vercel.get_analytics` | Traffic and usage stats |
| Get Build Metrics | `deployments:read` | `vercel.get_build_metrics` | Build time, size |

### 2.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Trigger Deployment (preview) | Low | No | Auto-deploy allowed |
| Trigger Deployment (production) | High | Yes | Production deploys need approval |
| Cancel Deployment | Medium | Yes | Only if in-progress |
| Rollback Deployment | High | Yes | Production rollbacks need approval |
| Update Env Vars (production) | High | Yes | Production env changes need approval |
| Delete Project | Critical | Yes | Requires org admin approval |

---

## 3. GitHub

### 3.1 OAuth Scopes Required

```
repo:status         - Read commit statuses
repo:write          - Create/update repos, push code
pull_requests:read  - Read PRs and comments
pull_requests:write - Create/update/merge PRs
security_events:read - Read security alerts
security_events:write - Dismiss security alerts
actions:read        - Read workflow runs
actions:write       - Trigger workflows
```

### 3.2 Features & Capabilities

#### **Repository Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Repos | `repo:status` | `github.list_repos` | Get all repos for org/user |
| Get Repo Info | `repo:status` | `github.get_repo_info` | Fetch repo metadata |
| Create Repo | `repo:write` | `github.create_repo` | Create new repository |
| Get Branch | `repo:status` | `github.get_branch` | Get branch info |
| Create Branch | `repo:write` | `github.create_branch` | Create new branch |
| Get File | `repo:status` | `github.get_file` | Fetch file contents |
| Update File | `repo:write` | `github.update_file` | Modify file |
| Delete File | `repo:write` | `github.delete_file` | Remove file |

#### **Pull Requests**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List PRs | `pull_requests:read` | `github.list_prs` | Get all PRs for repo |
| Get PR | `pull_requests:read` | `github.get_pr` | Fetch PR details |
| Create PR | `pull_requests:write` | `github.create_pr` | Create new PR |
| Update PR | `pull_requests:write` | `github.update_pr` | Modify PR title/body |
| Merge PR | `pull_requests:write` | `github.merge_pr` | Merge PR (requires approval) |
| Close PR | `pull_requests:write` | `github.close_pr` | Close PR without merging |
| Get PR Reviews | `pull_requests:read` | `github.get_pr_reviews` | List PR reviews |
| Request Review | `pull_requests:write` | `github.request_review` | Request reviewer |

#### **Security & Dependabot**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Security Alerts | `security_events:read` | `github.list_security_alerts` | Get Dependabot alerts |
| Get Alert Details | `security_events:read` | `github.get_alert_details` | Fetch vulnerability info |
| Dismiss Alert | `security_events:write` | `github.dismiss_alert` | Dismiss false positive |
| Get Dependabot PRs | `pull_requests:read` | `github.get_dependabot_prs` | List auto-fix PRs |
| Auto-Merge Dependabot | `pull_requests:write` | `github.auto_merge_dependabot` | Merge low-risk fixes |

#### **Actions & Workflows**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Workflows | `actions:read` | `github.list_workflows` | Get all workflows |
| Trigger Workflow | `actions:write` | `github.trigger_workflow` | Start workflow run |
| Get Workflow Run | `actions:read` | `github.get_workflow_run` | Check run status |
| Cancel Workflow Run | `actions:write` | `github.cancel_workflow_run` | Cancel in-progress run |
| Get Workflow Logs | `actions:read` | `github.get_workflow_logs` | Fetch run logs |

#### **Issues & Comments**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Issues | `repo:status` | `github.list_issues` | Get all issues |
| Create Issue | `repo:write` | `github.create_issue` | Create new issue |
| Update Issue | `repo:write` | `github.update_issue` | Modify issue |
| Close Issue | `repo:write` | `github.close_issue` | Close issue |
| Add Comment | `repo:write` | `github.add_comment` | Add comment to issue/PR |

### 3.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Create PR | Low | No | Auto-create allowed |
| Merge PR (non-main) | Medium | No | Feature branches OK |
| Merge PR (main branch) | High | Yes | Main branch requires approval |
| Delete File | Medium | Yes | Code deletion needs review |
| Dismiss Security Alert | High | Yes | Security dismissals need approval |
| Trigger Workflow (prod) | High | Yes | Production workflows need approval |

---

## 4. Snyk

**Evidence status:** `BLOCKED` — set to `PASS` only with an authenticated provider result and matching AmbiOS audit evidence; set to `FAIL` after an attempted check does not meet the requirement.

### 4.1 OAuth Scopes Required

```
project:read      - Read project info and vulnerabilities
project:write     - Apply fixes and patches
dependency:read   - Read dependency tree
dependency:write  - Upgrade dependencies
org:read          - Read org settings
```

### 4.2 Features & Capabilities

#### **Vulnerability Scanning**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Scan Project | `project:read` | `snyk.scan_project` | Trigger security scan |
| Get Vulnerabilities | `project:read` | `snyk.get_vulnerabilities` | List all vulnerabilities |
| Filter by Severity | `project:read` | `snyk.filter_vulnerabilities` | Filter by severity level |
| Get Vulnerability Details | `project:read` | `snyk.get_vulnerability_details` | Detailed CVE info |
| Get Dependency Tree | `dependency:read` | `snyk.get_dependency_tree` | Show dependency graph |

#### **Fix Recommendations**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Suggest Fix | `project:read` | `snyk.suggest_fix` | Get remediation advice |
| Get Upgrade Path | `dependency:read` | `snyk.get_upgrade_path` | Show upgrade chain |
| Check Breaking Changes | `dependency:read` | `snyk.check_breaking_changes` | Detect breaking changes |
| Get Patch Info | `project:read` | `snyk.get_patch_info` | Patch availability |

#### **Apply Fixes**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Apply Fix | `dependency:write` | `snyk.apply_fix` | Upgrade dependency |
| Create PR | `project:write` | `snyk.create_fix_pr` | Auto-create fix PR |
| Batch Fix | `dependency:write` | `snyk.batch_fix` | Fix multiple vulns |
| Ignore Vulnerability | `project:write` | `snyk.ignore_vulnerability` | Mark as accepted risk |

#### **License Compliance**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Licenses | `dependency:read` | `snyk.get_licenses` | List all licenses |
| Check License Compliance | `org:read` | `snyk.check_license_compliance` | Policy violations |
| Get License Risks | `dependency:read` | `snyk.get_license_risks` | Risky licenses |

#### **Container & IaC Security**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Scan Container Image | `project:read` | `snyk.scan_container` | Scan Docker image |
| Scan IaC Config | `project:read` | `snyk.scan_iac` | Scan Terraform/K8s |
| Get Misconfigurations | `project:read` | `snyk.get_misconfigurations` | IaC issues |

### 4.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Scan Project | Low | No | Auto-scan allowed |
| Suggest Fix (patch version) | Low | No | Safe upgrades auto-approved |
| Suggest Fix (major version) | High | Yes | Major upgrades need approval |
| Apply Fix (auto-merge) | Medium | Yes | PR creation needs approval |
| Ignore Vulnerability | High | Yes | Security exceptions need approval |
| Batch Fix (all vulns) | High | Yes | Bulk changes need approval |

---

## 5. Socket.dev

**Evidence status:** `BLOCKED` — set to `PASS` only with an authenticated provider result and matching AmbiOS audit evidence; set to `FAIL` after an attempted check does not meet the requirement.

### 5.1 OAuth Scopes Required

```
analyze:read      - Analyze packages and read risk scores
report:read       - Generate and read security reports
malware:read      - Check for malware
project:read      - Read project info
```

### 5.2 Features & Capabilities

#### **Package Analysis**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Analyze Package | `analyze:read` | `socket.analyze_package` | Get risk score and issues |
| Get Risk Score | `analyze:read` | `socket.get_risk_score` | Overall risk (0-100) |
| Get Supply Chain Issues | `analyze:read` | `socket.get_supply_chain_issues` | List all issues |
| Get Maintainer Info | `analyze:read` | `socket.get_maintainer_info` | Trust score, history |
| Get License Info | `analyze:read` | `socket.get_license_info` | License analysis |

#### **Malware Detection**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Detect Malware | `malware:read` | `socket.detect_malware` | Check for malware |
| Get Malware Report | `malware:read` | `socket.get_malware_report` | Detailed malware analysis |
| Check Suspicious Behaviors | `malware:read` | `socket.check_suspicious_behaviors` | Risky patterns |

#### **Project Reports**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Supply Chain Report | `report:read` | `socket.get_supply_chain_report` | Project-wide report |
| Get Critical Issues | `report:read` | `socket.get_critical_issues` | High-risk findings |
| Get Recommendations | `report:read` | `socket.get_recommendations` | Remediation advice |
| Get Compliance Status | `report:read` | `socket.get_compliance_status` | Policy compliance |

#### **Dependency Analysis**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Dependency Depth | `analyze:read` | `socket.get_dependency_depth` | Transitive deps |
| Get Lockfile Status | `analyze:read` | `socket.get_lockfile_status` | Lockfile presence |
| Get SBOM Status | `analyze:read` | `socket.get_sbom_status` | Software Bill of Materials |

### 5.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Analyze Package | Low | No | Auto-analysis allowed |
| Get Risk Score | Low | No | Read-only operation |
| Detect Malware | Low | No | Read-only operation |
| Block Malicious Package | Critical | Yes | Requires human confirmation |
| Remove Malicious Package | Critical | Yes | Requires org admin approval |

---

## 6. Notion

### 6.1 OAuth Scopes Required

```
content:read      - Read pages and databases
content:write     - Create/update pages and databases
users:read        - Read user info
```

### 6.2 Features & Capabilities

#### **Page Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Page | `content:read` | `notion.get_page` | Fetch page content |
| Create Page | `content:write` | `notion.create_page` | Create new page |
| Update Page | `content:write` | `notion.update_page` | Modify page content |
| Delete Page | `content:write` | `notion.delete_page` | Remove page |
| Search Pages | `content:read` | `notion.search_pages` | Search across workspace |

#### **Database Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Database | `content:read` | `notion.get_database` | Fetch database schema |
| Query Database | `content:read` | `notion.query_database` | Query database rows |
| Create Database Item | `content:write` | `notion.create_database_item` | Add row to database |
| Update Database Item | `content:write` | `notion.update_database_item` | Modify row |
| Delete Database Item | `content:write` | `notion.delete_database_item` | Remove row |

#### **Content Blocks**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Append Block | `content:write` | `notion.append_block` | Add content block |
| Update Block | `content:write` | `notion.update_block` | Modify block |
| Delete Block | `content:write` | `notion.delete_block` | Remove block |
| Get Block Children | `content:read` | `notion.get_block_children` | List nested blocks |

#### **Comments**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Comments | `content:read` | `notion.get_comments` | List page comments |
| Create Comment | `content:write` | `notion.create_comment` | Add comment to page |

### 6.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Create Page | Low | No | Auto-create allowed |
| Update Page | Low | No | Content updates OK |
| Delete Page | Medium | Yes | Deletion needs approval |
| Create Database Item | Low | No | Auto-create allowed |
| Delete Database Item | Medium | Yes | Deletion needs approval |

---

## 7. Shopify

### 7.1 OAuth Scopes Required

```
read_products     - Read product info
write_products    - Create/update products
read_inventory    - Read inventory levels
write_inventory   - Update inventory
read_orders       - Read order info
write_orders      - Create/update orders
read_customers    - Read customer info
```

### 7.2 Features & Capabilities

#### **Product Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Products | `read_products` | `shopify.get_products` | List all products |
| Get Product | `read_products` | `shopify.get_product` | Fetch product details |
| Create Product | `write_products` | `shopify.create_product` | Add new product |
| Update Product | `write_products` | `shopify.update_product` | Modify product |
| Delete Product | `write_products` | `shopify.delete_product` | Remove product |
| Get Product Variants | `read_products` | `shopify.get_product_variants` | List variants |

#### **Inventory Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Inventory Levels | `read_inventory` | `shopify.get_inventory_levels` | Stock levels |
| Update Inventory | `write_inventory` | `shopify.update_inventory` | Adjust stock |
| Get Inventory Items | `read_inventory` | `shopify.get_inventory_items` | List inventory items |

#### **Order Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Orders | `read_orders` | `shopify.get_orders` | List all orders |
| Get Order | `read_orders` | `shopify.get_order` | Fetch order details |
| Create Order | `write_orders` | `shopify.create_order` | Create new order |
| Update Order | `write_orders` | `shopify.update_order` | Modify order |
| Cancel Order | `write_orders` | `shopify.cancel_order` | Cancel order |
| Fulfill Order | `write_orders` | `shopify.fulfill_order` | Mark as fulfilled |

#### **Customer Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Customers | `read_customers` | `shopify.get_customers` | List customers |
| Get Customer | `read_customers` | `shopify.get_customer` | Fetch customer details |
| Create Customer | `write_customers` | `shopify.create_customer` | Add new customer |
| Update Customer | `write_customers` | `shopify.update_customer` | Modify customer |

### 7.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Create Product | Low | No | Auto-create allowed |
| Update Product | Low | No | Content updates OK |
| Delete Product | Medium | Yes | Deletion needs approval |
| Update Inventory | Low | No | Stock adjustments OK |
| Create Order | Medium | Yes | Order creation needs approval |
| Cancel Order | High | Yes | Cancellations need approval |
| Fulfill Order | Medium | Yes | Fulfillment needs approval |

---

## 8. Slack

### 8.1 OAuth Scopes Required

```
chat:write        - Send messages
chat:read         - Read messages
channels:read     - List public channels
channels:write    - Create/manage channels
users:read        - Read user info
reactions:write   - Add reactions
```

### 8.2 Features & Capabilities

#### **Messaging**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Send Message | `chat:write` | `slack.send_message` | Post message to channel |
| Send DM | `chat:write` | `slack.send_dm` | Send direct message |
| Update Message | `chat:write` | `slack.update_message` | Edit message |
| Delete Message | `chat:write` | `slack.delete_message` | Remove message |
| Get Thread Replies | `chat:read` | `slack.get_thread_replies` | Fetch thread messages |

#### **Channel Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Channels | `channels:read` | `slack.list_channels` | Get all channels |
| Create Channel | `channels:write` | `slack.create_channel` | Create new channel |
| Archive Channel | `channels:write` | `slack.archive_channel` | Archive channel |
| Invite Users | `channels:write` | `slack.invite_to_channel` | Add users to channel |

#### **Reactions & Engagement**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Add Reaction | `reactions:write` | `slack.add_reaction` | Add emoji reaction |
| Remove Reaction | `reactions:write` | `slack.remove_reaction` | Remove reaction |

### 8.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Send Message | Low | No | Auto-send allowed |
| Send DM | Low | No | Direct messages OK |
| Create Channel | Medium | Yes | Channel creation needs approval |
| Archive Channel | High | Yes | Archiving needs approval |
| Delete Message | Medium | Yes | Deletion needs approval |

---

## 9. Jira

### 9.1 OAuth Scopes Required

```
read:jira         - Read issues and projects
write:jira        - Create/update issues
read:jira-work    - Read workflows
write:jira-work   - Transition issues
```

### 9.2 Features & Capabilities

#### **Issue Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Issue | `read:jira` | `jira.get_issue` | Fetch issue details |
| Create Issue | `write:jira` | `jira.create_issue` | Create new issue |
| Update Issue | `write:jira` | `jira.update_issue` | Modify issue |
| Transition Issue | `write:jira-work` | `jira.transition_issue` | Change status |
| Delete Issue | `write:jira` | `jira.delete_issue` | Remove issue |
| Add Comment | `write:jira` | `jira.add_comment` | Add comment |
| Attach File | `write:jira` | `jira.attach_file` | Upload attachment |

#### **Project Management**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Projects | `read:jira` | `jira.list_projects` | Get all projects |
| Get Project | `read:jira` | `jira.get_project` | Fetch project details |
| Get Components | `read:jira` | `jira.get_components` | List project components |
| Get Versions | `read:jira` | `jira.get_versions` | List fix versions |

#### **Search & Query**

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Search Issues | `read:jira` | `jira.search_issues` | JQL search |
| Get Issue Types | `read:jira` | `jira.get_issue_types` | List issue types |
| Get Statuses | `read:jira` | `jira.get_statuses` | List workflow statuses |

### 9.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Create Issue | Low | No | Auto-create allowed |
| Update Issue | Low | No | Content updates OK |
| Transition Issue | Medium | Yes | Status changes need approval |
| Delete Issue | High | Yes | Deletion needs approval |
| Attach File | Low | No | Auto-upload allowed |

---

## 10. Linear

### 10.1 OAuth Scopes Required

```
read              - Read issues and teams
write             - Create/update issues
```

### 10.2 Features & Capabilities

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Issues | `read` | `linear.get_issues` | List all issues |
| Get Issue | `read` | `linear.get_issue` | Fetch issue details |
| Create Issue | `write` | `linear.create_issue` | Create new issue |
| Update Issue | `write` | `linear.update_issue` | Modify issue |
| Delete Issue | `write` | `linear.delete_issue` | Remove issue |
| Add Comment | `write` | `linear.add_comment` | Add comment |
| Get Teams | `read` | `linear.get_teams` | List all teams |
| Get User | `read` | `linear.get_user` | Fetch user info |

### 10.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Create Issue | Low | No | Auto-create allowed |
| Update Issue | Low | No | Content updates OK |
| Delete Issue | Medium | Yes | Deletion needs approval |

---

## 11. Datadog

### 11.1 OAuth Scopes Required

```
metrics:read      - Read metrics and monitors
logs:read         - Read logs
monitors:read     - Read monitors
monitors:write    - Create/update monitors
dashboards:read   - Read dashboards
```

### 11.2 Features & Capabilities

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| Get Metrics | `metrics:read` | `datadog.get_metrics` | Fetch metrics |
| Query Metrics | `metrics:read` | `datadog.query_metrics` | Time-series query |
| Get Logs | `logs:read` | `datadog.get_logs` | Fetch logs |
| Search Logs | `logs:read` | `datadog.search_logs` | Log search |
| Get Monitors | `monitors:read` | `datadog.get_monitors` | List monitors |
| Get Monitor Status | `monitors:read` | `datadog.get_monitor_status` | Check alert state |
| Create Monitor | `monitors:write` | `datadog.create_monitor` | Create alert |
| Get Dashboards | `dashboards:read` | `datadog.get_dashboards` | List dashboards |

### 11.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Get Metrics | Low | No | Read-only operation |
| Get Logs | Low | No | Read-only operation |
| Create Monitor | Medium | Yes | Alert creation needs approval |
| Update Monitor | Medium | Yes | Alert changes need approval |

---

## 12. AWS

### 12.1 IAM Permissions Required

```
lambda:ListFunctions
lambda:GetFunction
lambda:UpdateFunctionCode
lambda:InvokeFunction
cloudwatch:GetMetricData
cloudwatch:GetLogEvents
s3:GetObject
s3:PutObject
s3:ListBucket
```

### 12.2 Features & Capabilities

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Lambda Functions | `lambda:ListFunctions` | `aws.list_lambda_functions` | Get all Lambdas |
| Get Lambda Code | `lambda:GetFunction` | `aws.get_lambda_code` | Fetch function code |
| Update Lambda | `lambda:UpdateFunctionCode` | `aws.update_lambda` | Deploy new code |
| Invoke Lambda | `lambda:InvokeFunction` | `aws.invoke_lambda` | Execute function |
| Get CloudWatch Metrics | `cloudwatch:GetMetricData` | `aws.get_cloudwatch_metrics` | Fetch metrics |
| Get CloudWatch Logs | `cloudwatch:GetLogEvents` | `aws.get_cloudwatch_logs` | Fetch logs |
| Get S3 Object | `s3:GetObject` | `aws.get_s3_object` | Download from S3 |
| Put S3 Object | `s3:PutObject` | `aws.put_s3_object` | Upload to S3 |
| List S3 Bucket | `s3:ListBucket` | `aws.list_s3_bucket` | List bucket contents |

### 12.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Get Lambda Code | Low | No | Read-only operation |
| Update Lambda (staging) | Medium | No | Staging deploys OK |
| Update Lambda (production) | High | Yes | Production deploys need approval |
| Invoke Lambda | Medium | Yes | Execution needs approval |
| Put S3 Object | Medium | Yes | Upload needs approval |

---

## 13. Google Cloud

### 13.1 IAM Permissions Required

```
cloudfunctions.list
cloudfunctions.get
cloudfunctions.update
cloudfunctions.call
monitoring.metrics.list
monitoring.timeSeries.list
logging.logEntries.list
storage.objects.get
storage.objects.create
```

### 13.2 Features & Capabilities

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Cloud Functions | `cloudfunctions.list` | `gcp.list_cloud_functions` | Get all functions |
| Get Function | `cloudfunctions.get` | `gcp.get_cloud_function` | Fetch function details |
| Update Function | `cloudfunctions.update` | `gcp.update_cloud_function` | Deploy new code |
| Call Function | `cloudfunctions.call` | `gcp.call_cloud_function` | Invoke function |
| Get Metrics | `monitoring.metrics.list` | `gcp.get_metrics` | Fetch metrics |
| Get Time Series | `monitoring.timeSeries.list` | `gcp.get_time_series` | Time-series data |
| Get Logs | `logging.logEntries.list` | `gcp.get_logs` | Fetch logs |
| Get Storage Object | `storage.objects.get` | `gcp.get_storage_object` | Download from GCS |
| Create Storage Object | `storage.objects.create` | `gcp.create_storage_object` | Upload to GCS |

### 13.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| Get Function | Low | No | Read-only operation |
| Update Function (staging) | Medium | No | Staging deploys OK |
| Update Function (production) | High | Yes | Production deploys need approval |
| Call Function | Medium | Yes | Execution needs approval |

---

## 14. Nango

### 14.1 API Permissions Required

```
connections:read    - Read connection metadata
connections:write   - Create/update connections
actions:read        - Read action definitions
actions:write       - Trigger actions
syncs:read          - Read sync definitions
syncs:write         - Trigger syncs
```

### 14.2 Features & Capabilities

| Feature | Permission | WebMCP Tool | Description |
|---------|-----------|-------------|-------------|
| List Connections | `connections:read` | `nango.list_connections` | Get all connections |
| Get Connection | `connections:read` | `nango.get_connection` | Fetch connection details |
| Create Connection | `connections:write` | `nango.create_connection` | Start OAuth flow |
| Trigger Action | `actions:write` | `nango.trigger_action` | Execute action |
| Get Action Result | `actions:read` | `nango.get_action_result` | Fetch action output |
| Trigger Sync | `syncs:write` | `nango.trigger_sync` | Run sync job |
| Get Sync Status | `syncs:read` | `nango.get_sync_status` | Check sync state |
| Get Sync Results | `syncs:read` | `nango.get_sync_results` | Fetch sync data |

### 14.3 Approval Requirements

| Action | Risk Level | Approval Required | Notes |
|--------|-----------|-------------------|-------|
| List Connections | Low | No | Read-only operation |
| Create Connection | Medium | Yes | OAuth initiation needs approval |
| Trigger Action | Medium | Yes | Action execution needs approval |
| Trigger Sync | Low | No | Auto-sync allowed |

---

## Summary Matrix

### Read-Only Operations (No Approval Required)

- List/get resources
- Fetch logs and metrics
- Query databases
- Search issues/pages
- Get analytics

### Write Operations (Approval Required)

- Deploy to production
- Delete resources
- Merge to main branch
- Update production env vars
- Cancel orders
- Dismiss security alerts

### High-Risk Operations (Org Admin Approval)

- Delete projects/repos
- Production rollbacks
- Security exception approvals
- Bulk operations
- Credential exposure

---

**This document provides comprehensive feature mapping for all vendors integrated with AmbiOS AI, including required permissions, WebMCP tool names, and approval requirements.**
