# AmbiOS AI – Customer Success and Support Strategy

## 1. Introduction

### 1.1 Role and Objectives

You own customer success and support for AmbiOS AI.
Your goal is simple. Help customers get value fast. Keep them successful over time. Turn issues into improvements.

This document gives you the playbook. It covers onboarding, training, support, issue resolution, satisfaction tracking, and long-term engagement.

### 1.2 Customer Success Vision

AmbiOS AI helps teams run safer, faster, and more visible human-and-agent workflows.
Customers succeed when they:

- Deploy the platform in their environment
- Connect at least one external system
- Run at least one real human-and-agent workflow
- See clear audit trails and guardrails in action
- Report fewer incidents or faster resolution times

Your job is to make that path obvious, supported, and repeatable.

---

## 2. Customer Onboarding and Training

### 2.1 Onboarding Process

Use a simple, repeatable onboarding flow for every new customer or pilot team.

1. Kickoff call (30 minutes)
   - Confirm goals, team, timeline
   - Identify one high-value workflow to start with (for example, incident hot-fix)
   - Agree on success metrics for the first 30 days

2. Environment setup
   - Help the customer configure:
     - AmbiOS URL and API endpoint
     - Supabase Auth and Google OAuth
     - Cloudflare project and bindings
     - Nango integrations for at least one provider
   - Provide a checklist and a short Loom video for each step

3. First workflow activation
   - Pick one workflow from the kickoff call
   - Walk through:
     - Creating or importing a service
     - Creating or simulating an incident
     - Running a guardrailed hot-fix with human approval
   - Confirm the customer can see the action in the Agent Activity Console

4. 7-day check-in
   - Review usage:
     - Number of orgs, agents, services, incidents
     - Number of WebMCP tool calls
     - Number of humans who used the workspace
   - Unblock any friction
   - Plan the next workflow

5. 30-day success review
   - Measure against kickoff goals
   - Decide on expansion:
     - More services
     - More connectors
     - More teams

### 2.2 Training Materials and Sessions

Provide short, focused training assets.

- Live sessions
  - 45-minute onboarding workshop
  - 30-minute advanced workflows session
  - 30-minute admin and governance session

- Recorded content
  - 5-minute product overview
  - 10-minute first workflow walkthrough
  - 5-minute guardrails and approvals explainer
  - 5-minute integrations setup overview

- Written guides
  - Quick start guide (2 pages)
  - Admin guide (orgs, agents, policies, budgets)
  - Developer guide (API, WebMCP tools, examples)
  - Incident response playbook (for operators)

Keep all content under 10 minutes per item. Use plain language. Show real screens.

### 2.3 User Resources and Documentation

Maintain a central docs site with:

- Getting started
- Concepts (agents, guardrails, actions, incidents, docs, budgets)
- How-to guides by role:
  - Developer
  - Operator
  - Admin
  - Business user
- API reference
- WebMCP tool reference
- Troubleshooting guides
- Security and compliance notes

Link docs from:
- The product UI
- Onboarding emails
- Support tickets
- Community channels

---

## 3. Issue Management and Ticket Resolution

### 3.1 Ticketing System Workflow

Use a single ticketing system for all customer issues. Examples: Jira Service Management, Linear, or a dedicated helpdesk tool.

Standard ticket flow:

1. Intake
   - Customer submits via:
     - In-app support link
     - Email
     - Community escalation
   - Auto-create ticket with:
     - Customer name
     - Org ID
     - Environment
     - Severity
     - Category (bug, feature, question, integration, access)

2. Triage
   - Support agent reviews within 1 business day
   - Assigns:
     - Priority
     - Owner
     - Next action

3. Diagnosis
   - Owner gathers:
     - Steps to reproduce
     - Expected vs actual behavior
     - Logs, screenshots, action IDs
   - Updates ticket with findings

4. Resolution
   - Fix, workaround, or documented limitation
   - Confirm with customer
   - Close ticket with:
     - Root cause
     - Resolution type
     - Time to resolve

5. Follow-up
   - For high-impact issues, send a short summary:
     - What happened
     - What changed
     - How to avoid in the future

### 3.2 Issue Prioritization and Escalation

Use clear priority levels.

- P1 – Critical
  - Production outage for a paying customer
  - Security incident
  - Data loss or corruption
  - Response: 1 hour, 24x7

- P2 – High
  - Major feature broken, strong workaround exists
  - Multiple teams blocked
  - Response: 1 business day

- P3 – Medium
  - Single user impacted
  - Non-critical feature issue
  - Response: 2 business days

- P4 – Low
  - Nice to have
  - Documentation gap
  - Response: next sprint planning

Escalation rules:

- P1 tickets escalate to engineering lead immediately
- P2 tickets escalate after 24 hours without progress
- Security issues escalate to security lead and leadership
- Integration outages trigger comms to all affected customers

### 3.3 Rapid Resolution Techniques

Use these patterns to resolve issues fast.

- Reproduce in a sandbox
  - Spin up a demo org with similar config
  - Replay the issue with minimal noise

- Use action IDs and logs
  - Every action has an ID
  - Pull logs, inputs, outputs, guardrail decisions

- Isolate layers
  - Frontend vs API vs integration vs provider
  - Disable connectors to isolate

- Provide workarounds
  - Document a safe manual path while the fix lands

- Communicate early
  - Even if you do not have a fix, share what you know and next steps

---

## 4. Customer Satisfaction and Health

### 4.1 NPS and CSAT Measurement

Track two core metrics.

- Net Promoter Score (NPS)
  - Ask every 90 days:
    - On a scale of 0 to 10, how likely are you to recommend AmbiOS AI to a colleague or peer?
  - Classify:
    - 9 to 10: Promoter
    - 7 to 8: Neutral
    - 0 to 6: Critic
  - NPS = percent of Promoters minus percent of Critics
  - Target for early stage: NPS above 30

- Customer Satisfaction (CSAT)
  - Ask after key moments:
    - After onboarding
    - After a resolved P1 or P2 ticket
    - After a major release
  - Question:
    - How satisfied are you with AmbiOS AI? (Very dissatisfied to Very satisfied)
  - Track percent of satisfied responses
  - Target: 80 percent or higher

Use short surveys. 1 to 3 questions max. Include an optional comment field.

### 4.2 Customer Health Scoring Models

Build a simple health score per org. Use weighted signals.

Example model:

- Product usage (40 percent)
  - Weekly active users
  - Number of agent actions per week
  - Number of services connected

- Value realization (30 percent)
  - Number of completed workflows
  - Reduction in incident resolution time
  - Number of guardrailed actions approved

- Relationship strength (20 percent)
  - NPS score
  - Attendance at check-in calls
  - Participation in beta programs

- Risk signals (10 percent)
  - Open P1 or P2 tickets older than 7 days
  - Declining usage trend
  - Key champion left the team

Score each dimension 0 to 5. Multiply by weight. Sum to get a 0 to 5 health score.

- 4.0 to 5.0: Healthy
- 2.5 to 3.9: At risk
- Below 2.5: Critical

Review health scores weekly. Trigger actions:

- Healthy: ask for testimonials, referrals, case studies
- At risk: schedule a working session, review roadmap fit
- Critical: executive outreach, success plan, possible discount or extended support

### 4.3 Feedback Collection and Analysis

Collect feedback from multiple channels.

- In-app feedback widget
  - One question at a time
  - Contextual to the page or workflow

- Post-call notes
  - After onboarding, check-ins, and QBRs
  - Log themes in a shared system

- Support tickets
  - Tag tickets with:
    - Feature area
    - Pain point
    - Requested outcome

- Community and social
  - Monitor forums, chats, and social posts
  - Capture recurring themes

Analyze feedback monthly.

- Group by theme
- Count frequency
- Link to health score and NPS
- Share top 5 themes with product and engineering

---

## 5. Proactive Communication and Relationship Building

### 5.1 Regular Check-ins and Updates

Set a cadence based on customer tier.

- Pilot and early adopters
  - Weekly 30-minute check-in for first 4 weeks
  - Then biweekly

- Paying customers
  - Monthly 30-minute success call
  - Quarterly business review

- All customers
  - Monthly product update email
  - Release notes in docs and in-app

In each check-in:

- Review goals and health score
- Review usage and wins
- Review open issues
- Plan next 2 to 4 weeks

### 5.2 Managing Customer Expectations

Be clear about what AmbiOS AI does and does not do today.

- Share the roadmap view appropriate for the customer
- Call out known limitations
- Give timeframes only when confident
- Offer alternatives when a feature is not ready

When incidents happen:

- Send a short status update within 1 hour for P1
- Share:
  - What is impacted
  - What you are doing
  - When the next update will arrive
- Post a brief post-incident summary within 2 business days

---

## 6. Continuous Improvement and Feedback Integration

### 6.1 Using Feedback to Drive Product and Process Enhancements

Turn feedback into action.

- Monthly product review
  - Top 5 feedback themes
  - Top 5 support drivers
  - Top 5 feature requests by health score impact

- Quarterly roadmap input
  - Customer problems, not just feature lists
  - Tie each theme to:
    - Retention risk
    - Expansion opportunity
    - Strategic fit

- Process improvements
  - If a ticket type repeats, create:
    - A doc page
    - A macro response
    - A product fix or guardrail

Track the impact of changes.

- Before and after usage
- Before and after ticket volume
- Before and after NPS or CSAT for affected customers

### 6.2 Team Training and Development

Train your success and support team on:

- AmbiOS AI architecture and stack
- WebMCP and agent concepts
- Common integration patterns
- Security and privacy basics
- Empathy and clear communication

Run:

- Weekly internal office hours to review tough tickets
- Monthly product deep dives with engineering
- Quarterly role-play on difficult conversations

Measure:

- Time to first response
- Time to resolution
- CSAT per agent
- Ticket reopen rate

Use these metrics to coach, not to punish.

---

## 7. Best Practices Summary

Use these rules every day.

1. Start with the customer goal. Not the feature. The goal.
2. Make onboarding a product problem. Not just a services problem.
3. Document the first 3 workflows that deliver value. Push customers to use them.
4. Treat every P1 as a chance to earn trust. Communicate early and often.
5. Close the loop on feedback. Tell customers what changed because of their input.
6. Keep docs short, concrete, and example-driven.
7. Measure what matters. NPS, CSAT, health score, time to value.
8. Automate repetitive support work. Macros, templates, and self-serve docs.
9. Share wins. Case studies, testimonials, and internal shout-outs.
10. Protect your time for proactive work. Not just tickets.

---

## 8. Key Concepts and Terminology

- Net Promoter Score (NPS)
  - A measure of loyalty. Based on how likely customers are to recommend AmbiOS AI.

- Customer Satisfaction (CSAT)
  - A measure of satisfaction with a specific interaction or overall experience.

- Onboarding
  - The process of getting a customer from signup to first value.

- Customer Health Score
  - A composite metric that predicts retention and expansion. Based on usage, value, relationship, and risk.

- Ticketing System
  - The tool and process used to track, prioritize, and resolve customer issues.

- Guardrails
  - Rules that control what agents and humans can do, and when approval is required.

- Agent Activity Console
  - A view of all human and agent actions, with inputs, outputs, and status.

- Context-Aware Hot-Fix
  - A workflow where an agent proposes and applies an incident fix under human approval and policy.

---

## 9. Templates and Checklists

### 9.1 Onboarding Checklist

- Kickoff call completed
- Goals and success metrics defined
- Environment configured
- First workflow activated
- 7-day and 30-day check-ins scheduled

### 9.2 P1 Incident Response Template

Subject: [P1] Incident impacting [customer-ai/org]

- Impact: what is broken
- Scope: who is affected
- Current status: what we know now
- Next steps: what we are doing
- Next update: when

### 9.3 Check-in Call Agenda

- Goals and health score review
- Wins and usage highlights
- Open issues and blockers
- Next 2 to 4 week plan
- Feedback and requests

---

Use this document as your base. Adapt it per customer tier and region. Keep it living. Update it when you learn something new.
