// Demo seed — realistic shape matching the original app. Run: node prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const ORG = "demo-organization";
const DEMO_PASSWORD_HASH = bcrypt.hashSync("Polaris2026!", 10);

const org = await prisma.organization.upsert({
  where: { id: ORG },
  update: {},
  create: { id: ORG, name: "Demo Org" },
});

// Roster mirrors the live app's 15 users; the three demo logins keep functional
// roles (admin/CAE/member) so every workflow stays exercisable.
const users = await Promise.all([
  ["demo-user",    "Sinethemba", "Zwane",    "sinethemba@stella-lumen.com",    "org:admin"],
  ["demo-user-2",  "Lusanda",    "Ntloko",   "lusanda@tzulu.co.za",            "org:chief_audit_executive"],
  ["demo-user-3",  "Amahle",     "Mtolo",    "amahle@stella-lumen.com",        "org:member"],
  ["demo-user-4",  "Nomkhosi",   "Madlala",  "nomkhosi@stella-lumen.com",      null],
  ["demo-user-5",  "Stella",     "Lumen",    "stella@stella-lumen.com",        "org:admin"],
  ["demo-user-6",  "NOMKHOSI",   "MADLALA",  "nomkhosi@stellalumen.co.za",     "org:chief_audit_executive"],
  ["demo-user-7",  "Thabani",    "Zulu",     "thabani@tzulu.co.za",            null],
  ["demo-user-8",  "Nomvelo",    "Makhanya", "nomvelo@stella-lumen.com",       "org:regulator"],
  ["demo-user-9",  "Nomfundo",   "Gumede",   "nomfundo@stella-lumen.com",      null],
  ["demo-user-10", "Phele",      "Dlamini",  "phelelisile@stella-lumen.com",   "org:member"],
  ["demo-user-11", "Lizo",       "Shongwe",  "lizo@stella-lumen.com",          "org:delegated_preparer"],
  ["demo-user-12", "Luthando",   "Zulu",     "luthando@stella-lumen.com",      "org:admin"],
  ["demo-user-13", "Amanda",     "Zondo",    "amanda@stella-lumen.com",        "org:member"],
  ["demo-user-14", "Sibonelo",   "Mbatha",   "smbatha@insightconsulting.co.za","org:admin"],
  ["demo-user-15", "Khumo",      "Molotsi",  "khumzo.molotsi12@gmail.com",     "org:member"],
].map(([id, first_name, last_name, email, role]) =>
  prisma.user.upsert({
    where: { id },
    update: { first_name, last_name, email, role: role || null, password_hash: DEMO_PASSWORD_HASH },
    create: { id, clerk_id: id, first_name, last_name, email, role: role || null, organization_id: ORG, password_hash: DEMO_PASSWORD_HASH },
  }),
  ),
);

// Descriptions + updaters match the live app's engagement types
const typeSeed = [
  ["Consulting Engagements", "Engagements with high inherent risk exposure without sufficient controls", users[2], "2025-11-29T16:43:36"],
  ["Statutory Audits", "Audits enforced by legislation", users[2], "2025-11-29T16:43:57"],
  ["PFMA Key Indicators", "National Key Indicators", users[2], "2025-11-29T16:45:42"],
  ["Adhoc Engagements", "Urgent Engagements driven by emerging threats", users[2], "2025-11-29T16:46:31"],
  ["Investigations", "Fraud and Corruption Cases", users[12], "2025-11-29T16:47:13"],
  ["Risk Based Audits", "Audit engagements with high inherent risk exposure on the profile", users[6], "2025-05-12T00:24:45"],
  ["Information Technology", "Audit of systems and the IT environment", users[6], "2025-05-12T00:37:24"],
];
const types = await Promise.all(
  typeSeed.map(([name, desc, u, ts], i) =>
    prisma.engagementType.upsert({
      where: { id: `et-${i + 1}` },
      update: {
        name, description: desc,
        updated_by: u.id, updated_at: new Date(ts),
      },
      create: {
        id: `et-${i + 1}`, name, description: desc, organization_id: ORG,
        created_by: u.id, created_at: new Date(Date.now() - (60 + i * 3) * 86400000),
        updated_by: u.id, updated_at: new Date(ts),
      },
    }),
  ),
);

// AAP periods — names/descriptions/dates/updaters match the live app's period list
const amahle = () => users[2].id, lusanda = () => users[1].id, amanda = () => users[12].id;
const periodSeed = [
  ["period-1",  "Audit of General IT Controls across the entity", "Audit of systems and the IT environment", "2025-03-03", "2025-04-30", "2026-03-25T09:43:52", amahle],
  ["period-2",  "Quarter Two",      "July to September",   "2025-07-01", "2025-09-30", "2025-05-12T00:39:20", amanda],
  ["period-3",  "Quarter Three",    "October to December", "2025-10-01", "2025-12-31", "2025-05-12T00:41:32", amahle],
  ["period-4",  "Quarter One",      "April to June",       "2025-04-01", "2025-06-30", "2025-05-12T00:45:19", amanda],
  ["period-5",  "2027 Quarter 1",   null,                  "2027-01-01", "2027-03-31", "2025-09-11T13:06:47", amahle],
  ["period-6",  "Quarter 4 2025",   null,                  "2026-01-01", "2026-03-31", "2025-09-11T14:52:24", amahle],
  ["period-7",  "Financial year 2026/27", null,            "2026-06-30", "2026-03-31", "2025-09-11T15:13:14", amahle],
  ["period-8",  "2028/2029",        "Annual Audit Plan",   "2028-03-01", "2029-03-31", "2025-11-28T23:06:51", lusanda],
  ["period-9",  "2026/27 Financial Year", null,            "2026-04-01", "2027-03-31", "2025-11-28T23:08:09", amahle],
  ["period-10", "2024 2025 Theme",  "Dental Health",       "2024-04-01", "2025-03-31", "2025-12-02T10:11:28", lusanda],
  ["period-11", "2025 2026 Theme",  null,                  "2025-04-01", "2026-03-31", "2025-12-02T10:27:29", lusanda],
];
await prisma.annualAuditPlan.updateMany({ data: { period_id: null } });
await prisma.annualAuditPlanPeriod.deleteMany({ where: { id: { startsWith: "period-" } } });
const periods = await prisma.$transaction(
  periodSeed.map(([id, name, description, start, end, updatedAt, upBy]) =>
    prisma.annualAuditPlanPeriod.create({
      data: {
        id, name, description,
        start_date: new Date(start), end_date: new Date(end),
        updated_at: new Date(updatedAt), updated_by: upBy(),
        organization_id: ORG,
      },
    }),
  ),
);
const period = periods[6]; // "Financial year 2026/27" — used by the default plan

// Plans — match the live grid's rows (name / description / period)
const planSeed = [
  ["aap-1",  "2026 2027 Theme",     "Dental Health",                              "Quarter One"],
  ["aap-2",  "2027 2028 Theme",     "Primary Health Care",                        "2027 Quarter 1"],
  ["aap-3",  "2024 2025 Theme",     "Mental Health",                              "2024 2025 Theme"],
  ["aap-4",  "2025 2026 Theme",     "Maternal Health",                            "2025 2026 Theme"],
  ["aap-5",  "Year of Governance",  "Perfecting governance across the organisation", "Financial year 2026/27"],
  ["aap-6",  "Core Functions",      "Focus on Core functions",                    "Quarter 4 2025"],
  ["aap-7",  "2028 2029 Theme",     "Service Offerings at District Health Fascilities", "2028/2029"],
  ["aap-8",  "2022 2023 Theme",     "Child Health",                               "Quarter Two"],
  ["aap-9",  "2023 2024 Theme",     "Heart Care",                                 "Quarter Three"],
  ["aap-10", "2026-2027 Year",      "Youth Interventions take priority",          "2026/27 Financial Year"],
];
for (const [i, [id, name, description, perName]] of planSeed.entries()) {
  const data = {
    name, description,
    period_id: periods.find((p) => p.name === perName)?.id ?? period.id,
    prepared_by_id: users[1].id, prepared_date: new Date(Date.UTC(2025, 11, 1 + i, 1, 43, 0)),
    authorised_by_id: users[1].id, authorised_date: new Date(Date.UTC(2025, 11, 1 + i, 1, 43, 0)),
  };
  await prisma.annualAuditPlan.upsert({
    where: { id },
    update: data,
    create: { id, ...data, organization_id: ORG },
  });
}
const aap = { id: "aap-1" };

const planned = await prisma.plannedEngagement.upsert({
  where: { id: "pe-1" },
  update: {},
  create: {
    id: "pe-1", reference: "PE-001", engagement_type_id: types[0].id, name: "Annual Financial Statement Audit",
    objectives: "Assess fair presentation of AFS", scope: "All divisions", location: "Head Office",
    assigned_senior_auditor_id: users[1].id, planned_start_date: new Date("2026-05-01"),
    planned_end_date: new Date("2026-06-30"), planned_budget: 300000, annual_audit_plan_id: aap.id,
    prepared_by_id: users[0].id, prepared_date: new Date(), organization_id: ORG,
  },
});

const day = 86400000;
const d = (offset) => new Date(Date.now() + offset * day);
// status: "done" | "active" | "todo" — drives dashboard charts
const engagementSeed = [
  ["eng-1",  "Road Infrastructure",              "2026 2027 Theme-1",  0, "active", planned.id],
  ["eng-2",  "Annual Financial Statement Audit", "2026 2027 Theme-2",  0, "done",   null],
  ["eng-3",  "Revenue Management Cycle",         "2026 2027 Theme-3",  0, "active", null],
  ["eng-4",  "Asset Verification",               "2026 2027 Theme-4",  0, "done",   null],
  ["eng-5",  "Supply Chain Management Review",   "2026 2027 Theme-5",  1, "active", null],
  ["eng-6",  "Fleet Management Review",          "2026 2027 Theme-6",  1, "todo",   null],
  ["eng-7",  "HR Payroll Review",                "2026 2027 Theme-7",  1, "done",   null],
  ["eng-8",  "POPIA Compliance Audit",           "2026 2027 Theme-8",  2, "active", null],
  ["eng-9",  "Occupational Health & Safety",     "2026 2027 Theme-9",  2, "todo",   null],
  ["eng-10", "IT General Controls Review",       "2026 2027 Theme-10", 3, "active", null],
  ["eng-11", "Cybersecurity Posture Assessment", "2026 2027 Theme-11", 3, "todo",   null],
];
const engagement = await Promise.all(
  engagementSeed.map(([id, name, num, typeIdx, status, peId]) =>
    prisma.engagement.upsert({
      where: { id },
      update: {
        engagement_name: name, engagement_number: num, engagement_type_id: types[typeIdx].id,
        start_date: status === "done" ? d(-150) : status === "active" ? d(-60) : d(30),
        end_date: status === "done" ? d(-20) : status === "active" ? d(60) : d(120),
        authorised_date: status === "done" ? d(-15) : null,
        authorised_by_id: status === "done" ? users[1].id : null,
        updated_at: d(-2), updated_by: users[1].id,
      },
      create: {
        id, annual_audit_plan_id: aap.id, engagement_type_id: types[typeIdx].id,
        engagement_name: name, engagement_number: num,
        start_date: status === "done" ? d(-150) : status === "active" ? d(-60) : d(30),
        end_date: status === "done" ? d(-20) : status === "active" ? d(60) : d(120),
        engagement_budget: 250000 + Number(num.split("-").pop()) * 50000,
        engagement_spend: status === "done" ? 240000 : status === "active" ? 90000 : 0,
        planned_engagement_id: peId,
        prepared_by_id: users[0].id, prepared_date: d(-160),
        authorised_by_id: status === "done" ? users[1].id : null,
        authorised_date: status === "done" ? d(-15) : null,
        organization_id: ORG,
      },
    }),
  ),
);

await prisma.engagementAuditor.deleteMany({ where: { engagement_id: { in: engagementSeed.map(([id]) => id) } } });
await prisma.engagementAuditor.createMany({
  data: engagement.flatMap((e) => [
    { engagement_id: e.id, user_id: users[1].id, position_on_audit: "SENIOR_AUDITOR", qualifications: "CIA, CA(SA)", experience: "8 years public sector", organization_id: ORG },
    { engagement_id: e.id, user_id: users[2].id, position_on_audit: "AUDITOR", qualifications: "BCom Hons", experience: "3 years", organization_id: ORG },
  ]),
});

// Findings: cleared (authorised) vs open; open findings on ended engagements = overdue
const findingSeed = [
  // [id, engagement idx, cleared]
  ["find-1", 0, true], ["find-2", 0, false],
  ["find-3", 1, true], ["find-4", 1, false], ["find-5", 1, false],
  ["find-6", 2, true], ["find-7", 2, false],
  ["find-8", 3, true], ["find-9", 3, true],
  ["find-10", 4, false], ["find-11", 4, true],
  ["find-12", 6, true], ["find-13", 6, false],
  ["find-14", 7, false], ["find-15", 9, false],
];
await prisma.engagementFindingAndRecommendations.deleteMany({ where: { id: { in: findingSeed.map(([id]) => id) } } });
await prisma.engagementFindingAndRecommendations.createMany({
  data: findingSeed.map(([id, eidx, cleared]) => ({
    id,
    engagement_id: engagement[eidx].id,
    detailed_finding: `Control weakness identified — ${id}`,
    root_cause: "Inadequate review procedures",
    recommendations: "Implement monthly reconciliation and sign-off",
    management_comment: "Agreed — remediation planned",
    prepared_date: d(-100),
    authorised_date: cleared ? d(-30) : null,
    organization_id: ORG,
  })),
});

// Declaration structure — matches the live app's prescribed sections & texts
const declStructure = [
  ["Legal and Ethical Behaviour", [
    "I will report all incidents of legal or regulatory violations if I identify them during the course of my duties",
    "I will not engage or be party to any activity that is illegal or discreditable to the organisation or the profession of internal auditing",
  ]],
  ["Honesty and Professional Courage", [
    "I will disclose all material facts known to me in order to enable the organisation to make well - informed decisions",
    "I will be truthful, accurate, clear, open, and respectful in all professional relationships and communication",
  ]],
  ["Individual Objectivity", [
    "Should I become aware of an impairment that may affect my objectivity, I will disclose the impairment to my supervisor immediately",
    "I will maintain professional objectivity whe performing all aspects of my internal audit duties",
    "I have no conflict of interest as it pertains to my duties on this engagement",
    "I will not accept any tangible or intangible item such as gifts, reward or favour that may impair or be perceived to impair my objectivity",
  ]],
  ["Relationships", [
    "I don't have any associations with management or member of staff in this organisation.",
  ]],
  ["Organisation's Ethical Expectations", [
    "I will report all behaviour within the organisation that is inconsistent with the organisation's ethical expectations",
  ]],
];
const declSecIds = declStructure.map((_, i) => `decl-sec-${i + 1}`);
await prisma.declarationSection.deleteMany({ where: { id: { in: declSecIds } } });
await prisma.declarationSection.createMany({
  data: declStructure.map(([name], i) => ({
    id: `decl-sec-${i + 1}`, name, custom_name: name, description: `${name} declarations`, prescribed: true, organization_id: ORG,
  })),
});
const declTexts = declStructure.flatMap(([, decls], si) =>
  decls.map((t, di) => ({ id: `decl-${si + 1}-${di + 1}`, text: t, secId: `decl-sec-${si + 1}` })),
);
await prisma.declaration.deleteMany({ where: { id: { in: declTexts.map((d) => d.id) } } });
await prisma.declaration.deleteMany({ where: { id: { in: ["decl-1", "decl-2"] } } });
await prisma.declaration.createMany({
  data: declTexts.map((d) => ({
    id: d.id, declaration_text: d.text, custom_text: d.text, prescribed: true,
    declaration_section_id: d.secId, organization_id: ORG,
  })),
});
// Document templates — match the live app's data (observed 30/03/2026):
// Planning: A1 Audit Engagement Plan, A2 Information Request, A3 System Documentation,
//           A5 Strategic Document, A6 TEST, A9 Strategic Document V2
// Reporting: D2 Draft Internal Audit Report, D3 Final Internal Audit Report (D1 is system-generated)
const tplData = [
  ["pdt-1", "Audit Engagement Plan", "A1"], ["pdt-2", "Information Request", "A2"],
  ["pdt-3", "System Documentation", "A3"], ["pdt-4", "Strategic Document", "A5"],
  ["pdt-5", "TEST", "A6"], ["pdt-6", "Strategic Document V2", "A9"],
];
await prisma.planningDocumentTemplate.deleteMany({ where: { id: { startsWith: "pdt-" } } });
await prisma.planningDocumentTemplate.createMany({
  data: tplData.map(([id, name, reference]) => ({
    id, name, reference, required: true, files: [], organization_id: ORG,
    updated_at: new Date("2026-03-30T12:03:57Z"), updated_by: users[1].id,
  })),
});
await prisma.reportDocumentTemplate.deleteMany({ where: { id: { startsWith: "rdt-" } } });
await prisma.reportDocumentTemplate.createMany({
  data: [
    { id: "rdt-1", name: "Draft Internal Audit Report", reference: "D2" },
    { id: "rdt-2", name: "Final Internal Audit Report", reference: "D3" },
  ].map((t) => ({
    ...t, required: true, files: [], organization_id: ORG,
    updated_at: new Date("2026-03-30T00:21:58Z"), updated_by: users[1].id,
  })),
});

// Stage items so the engagement dashboard staircase shows real statuses.
// eng-1 mirrors the original screenshot: PENDING(1) PENDING(1) PREPARED(1) PREPARED(2) PENDING(1)
// eng-2 shows authorised stages (green badges).
const stageIds = ["sdec-1", "sdec-2", "spd-1", "spd-2", "sapi-1", "sfwd-1", "sfwd-2", "srd-1"];
await prisma.engagementAuditorDeclaration.deleteMany({ where: { id: { in: ["sdec-1", "sdec-2"] } } });
await prisma.engagementPlanningDocument.deleteMany({ where: { id: { in: ["spd-1", "spd-2"] } } });
await prisma.engagementAuditProgramItem.deleteMany({ where: { id: { in: ["sapi-1"] } } });
await prisma.engagementFieldworkDocument.deleteMany({ where: { id: { in: ["sfwd-1", "sfwd-2"] } } });
await prisma.engagementReportDocument.deleteMany({ where: { id: { in: ["srd-1"] } } });

const aud1 = await prisma.engagementAuditor.findFirst({ where: { engagement_id: engagement[0].id } });
const aud2 = await prisma.engagementAuditor.findFirst({ where: { engagement_id: engagement[1].id } });
const decl = await prisma.declaration.findFirst();

await prisma.engagementAuditorDeclaration.createMany({
  data: [
    { id: "sdec-1", engagement_id: engagement[0].id, engagement_auditor_id: aud1?.id, declaration_id: decl?.id, confirmation_date: d(-20), organization_id: ORG },
    { id: "sdec-2", engagement_id: engagement[1].id, engagement_auditor_id: aud2?.id, declaration_id: decl?.id, confirmation_date: d(-40), authorised_by_engagement_auditor_id: aud2?.id, authorised_date: d(-30), organization_id: ORG },
  ],
});
await prisma.engagementPlanningDocument.createMany({
  data: [
    { id: "spd-1", name: "Audit Strategy", document_reference: "A3", type: "CUSTOM", files: [], engagement_id: engagement[0].id, organization_id: ORG },
    { id: "spd-2", name: "Materiality", document_reference: "A4", type: "CUSTOM", files: [], engagement_id: engagement[1].id, prepared_date: d(-40), authorised_date: d(-30), organization_id: ORG },
  ],
});
await prisma.engagementAuditProgramItem.createMany({
  data: [
    { id: "sapi-1", risk_reference: "R1", risk: "Expenditure may not be authorised", audit_objective: "Verify procurement compliance", audit_procedure: "Sample 25 contracts, inspect bid docs", engagement_id: engagement[0].id, prepared_date: d(-15), organization_id: ORG },
  ],
});
await prisma.engagementFieldworkDocument.createMany({
  data: [
    { id: "sfwd-1", name: "Procurement test results", document_reference: "B1", files: [], engagement_id: engagement[0].id, prepared_date: d(-10), organization_id: ORG },
    { id: "sfwd-2", name: "Contract inspection memo", document_reference: "B2", files: [], engagement_id: engagement[0].id, prepared_date: d(-8), organization_id: ORG },
  ],
});
await prisma.engagementReportDocument.createMany({
  data: [
    { id: "srd-1", name: "Draft audit report", document_reference: "C1", type: "CUSTOM", files: [], engagement_id: engagement[0].id, organization_id: ORG },
  ],
});

// ---------- tender modules: risk register, corrective actions, tasks, resources ----------
const riskIds = ["risk-1", "risk-2", "risk-3", "risk-4", "risk-5"];
await prisma.riskAssessment.deleteMany({ where: { id: { in: riskIds } } });
await prisma.riskAssessment.createMany({
  data: [
    { id: "risk-1", auditable_entity: "Procurement & SCM", risk_description: "Procurement contracts may be awarded without competitive bidding or proper authorisation", risk_category: "Compliance", inherent_likelihood: 4, inherent_impact: 5, inherent_score: 20, existing_controls: "Bid committees, delegation of authority matrix", residual_likelihood: 2, residual_impact: 4, residual_score: 8, linked_planned_engagement_id: planned.id, assessed_by_id: users[0].id, assessed_date: d(-90), organization_id: ORG },
    { id: "risk-2", auditable_entity: "Revenue Management", risk_description: "Revenue billed may not be collected, or levies misallocated between programmes", risk_category: "Financial", inherent_likelihood: 3, inherent_impact: 4, inherent_score: 12, existing_controls: "Monthly reconciliation, debtors ageing review", residual_likelihood: 2, residual_impact: 3, residual_score: 6, assessed_by_id: users[0].id, assessed_date: d(-90), organization_id: ORG },
    { id: "risk-3", auditable_entity: "Information Technology", risk_description: "Inadequate access controls over core systems may allow unauthorised changes", risk_category: "Information Technology", inherent_likelihood: 3, inherent_impact: 5, inherent_score: 15, existing_controls: "Active Directory policies, quarterly access reviews", residual_likelihood: 2, residual_impact: 4, residual_score: 8, assessed_by_id: users[1].id, assessed_date: d(-85), organization_id: ORG },
    { id: "risk-4", auditable_entity: "Skills Development Grants", risk_description: "Grant disbursements may be made to non-qualifying beneficiaries", risk_category: "Fraud", inherent_likelihood: 4, inherent_impact: 5, inherent_score: 20, existing_controls: "Eligibility verification, site visits", residual_likelihood: 3, residual_impact: 4, residual_score: 12, assessed_by_id: users[0].id, assessed_date: d(-80), organization_id: ORG },
    { id: "risk-5", auditable_entity: "Asset Management", risk_description: "Moveable assets may not be safeguarded or accurately recorded in the register", risk_category: "Operational", inherent_likelihood: 3, inherent_impact: 3, inherent_score: 9, existing_controls: "Annual asset verification, barcode tagging", residual_likelihood: 2, residual_impact: 2, residual_score: 4, assessed_by_id: users[2].id, assessed_date: d(-75), organization_id: ORG },
  ],
});

const caIds = ["ca-1", "ca-2", "ca-3", "ca-4"];
await prisma.correctiveAction.deleteMany({ where: { id: { in: caIds } } });
await prisma.correctiveAction.createMany({
  data: [
    { id: "ca-1", finding_id: "find-2", action_description: "Implement monthly procurement compliance checklist signed off by SCM manager", owner_user_id: users[1].id, due_date: d(-10), status: "IN_PROGRESS", progress: 60, organization_id: ORG },
    { id: "ca-2", finding_id: "find-4", action_description: "Roll out debtors collection workflow with automated reminders", owner_user_id: users[2].id, due_date: d(15), status: "OPEN", progress: 0, organization_id: ORG },
    { id: "ca-3", finding_id: "find-7", action_description: "Enforce quarterly user access reviews for all privileged accounts", owner_user_id: users[0].id, due_date: d(-25), status: "IMPLEMENTED", progress: 100, implemented_date: d(-30), organization_id: ORG },
    { id: "ca-4", finding_id: "find-10", action_description: "Update grant beneficiary eligibility checklist and re-verify current recipients", owner_user_id: users[1].id, due_date: d(30), status: "IN_PROGRESS", progress: 35, organization_id: ORG },
  ],
});

const taskIds = ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6"];
await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
await prisma.task.createMany({
  data: [
    { id: "task-1", title: "Complete independence declarations", engagement_id: engagement[0].id, stage: "Independence Assessment", assignee_user_id: users[1].id, due_date: d(-5), status: "DONE", completed_date: d(-6), organization_id: ORG },
    { id: "task-2", title: "Finalise audit strategy document", engagement_id: engagement[0].id, stage: "Engagement Planning", assignee_user_id: users[1].id, due_date: d(-2), status: "IN_PROGRESS", escalated: true, organization_id: ORG },
    { id: "task-3", title: "Perform procurement sample testing", engagement_id: engagement[0].id, stage: "Engagement Fieldwork", assignee_user_id: users[2].id, due_date: d(3), status: "IN_PROGRESS", organization_id: ORG },
    { id: "task-4", title: "Draft findings & recommendations", engagement_id: engagement[0].id, stage: "Engagement Reporting", assignee_user_id: users[2].id, due_date: d(5), status: "OPEN", organization_id: ORG },
    { id: "task-5", title: "Review AFS working papers", engagement_id: engagement[1].id, stage: "Engagement Fieldwork", assignee_user_id: users[0].id, due_date: d(-15), status: "IN_PROGRESS", escalated: true, organization_id: ORG },
    { id: "task-6", title: "Issue final audit report", engagement_id: engagement[1].id, stage: "Engagement Reporting", assignee_user_id: users[0].id, due_date: d(20), status: "OPEN", organization_id: ORG },
  ],
});

const teIds = ["te-1", "te-2", "te-3", "te-4", "te-5"];
await prisma.timeEntry.deleteMany({ where: { id: { in: teIds } } });
await prisma.timeEntry.createMany({
  data: [
    { id: "te-1", engagement_id: engagement[0].id, user_id: users[1].id, work_date: d(-12), hours: 7.5, description: "Planning documentation and strategy drafting", organization_id: ORG },
    { id: "te-2", engagement_id: engagement[0].id, user_id: users[2].id, work_date: d(-9), hours: 8, description: "Procurement sample selection and testing", organization_id: ORG },
    { id: "te-3", engagement_id: engagement[0].id, user_id: users[2].id, work_date: d(-6), hours: 6.5, description: "Contract inspection fieldwork", organization_id: ORG },
    { id: "te-4", engagement_id: engagement[1].id, user_id: users[0].id, work_date: d(-20), hours: 4, description: "AFS working paper review", organization_id: ORG },
    { id: "te-5", engagement_id: engagement[2].id, user_id: users[1].id, work_date: d(-30), hours: 8, description: "Revenue cycle walkthrough", organization_id: ORG },
  ],
});

const exIds = ["ex-1", "ex-2"];
await prisma.expense.deleteMany({ where: { id: { in: exIds } } });
await prisma.expense.createMany({
  data: [
    { id: "ex-1", engagement_id: engagement[0].id, user_id: users[2].id, description: "Travel to site inspection", amount: 1450.0, expense_date: d(-8), organization_id: ORG },
    { id: "ex-2", engagement_id: engagement[1].id, user_id: users[0].id, description: "Subsistence — regional office visit", amount: 820.5, expense_date: d(-18), organization_id: ORG },
  ],
});

console.log("seeded:", { org: org.id, users: users.length, engagements: engagement.length, findings: findingSeed.length, stageItems: stageIds.length, risks: riskIds.length, correctiveActions: caIds.length, tasks: taskIds.length, timeEntries: teIds.length, expenses: exIds.length });
await prisma.$disconnect();
