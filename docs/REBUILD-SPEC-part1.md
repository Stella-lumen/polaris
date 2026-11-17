# POLARIS — Rebuild Specification

Reconstructed from client bundles + live observation. Source app: internal audit management (Stella Lumen).

## Stack

- Next.js App Router + RSC, React, TypeScript
- Tailwind + shadcn/ui (sidebar, cards, forms), next-themes (class/system)
- Prisma + Postgres (snake_case), ULID ids, soft-delete + audit cols everywhere
- Clerk auth + orgs (dev instance in prod — fix to live)
- AG Grid Enterprise tables, Recharts, SheetJS xlsx export, zod, react-hook-form
- Resend email, Azure OpenAI gpt-4o-mini (southafricanorth, disabled), Vercel

## Server actions (name → ID)

- `addDelegatedPreparer` → `4057ed15385ba875d1e382fe16ed163536eadc0af5`
- `authoriseAnnualAuditPlanAction` → `40d1756bc1d11dd9ff3466229ad8da6785556e272b`
- `authoriseDeclarations` → `403c5ea7b91f3b9fd5633adc7abbabca6765cde02f`
- `authoriseEngagementAction` → `401a8883dcfc04742e34ff76d1c5b65390f768b362`
- `authoriseEngagementAuditProgramDocumentAction` → `6000f852947f3caf7e4ab492531966c5ec2a2c8a11`
- `authoriseEngagementFieldworkDocumentAction` → `603ab10139c54eeaab446535110845eca12fe51360`
- `authoriseEngagementFindingAndRecommendationsAction` → `602906ee8ce689ce03840843f36974e375fefa283a`
- `authoriseEngagementPlanningDocumentAction` → `603d3929bf625541601e9ba418e5b81efacd33541a`
- `authoriseEngagementReportDocumentAction` → `606cb68bfb9e498f328ba2245d6006e3022ccd1af2`
- `authorisePlannedEngagementAction` → `40fcda01712f474f83b810595427692c9aaaf8cc80`
- `createAnnualAuditPlanAction` → `4031043bf36ef5b862cd9aeaf87216cc5143964f40`
- `createAnnualAuditPlanPeriodAction` → `40aef98bcd244d8523f94f68b232427928eb693697`
- `createDeclaration` → `4021201ff6555792a32750a8546c2c7d2f21d62da1`
- `createDeclarationSection` → `40217e7d6717ddcced1ea84f1f7053611fddb23164`
- `createEngagementAction` → `40e76b35a94b9657047d51ada561a334785f661d3d`
- `createEngagementAuditProgramItemAction` → `40b4fe2c83879583161f5a6aac8d79b5cf5fa54103`
- `createEngagementFieldworkDocumentAction` → `40c0357bc8b9aaf8978f3faf5847cb6ee3c3e9cb46`
- `createEngagementPlanningDocumentAction` → `4087dc42d5edd0f5f3f822bdf5e291fd42e62ce964`
- `createEngagementReportDocumentAction` → `40dcc9d59436ea77af888e20cc24cebe8077551e6d`
- `createEngagementTypeAction` → `402225d5a3fef110a20de179d2e489bb9d28e9341f`
- `createGuidingDocumentAction` → `40b3b4685321ef088aba6938663c570ce11cbe2124`
- `createPlannedEngagementAction` → `602a76a09355556a56459ca54300760573aa01a86b`
- `createPlanningTemplateAction` → `40f2d5946f6fb9bd16fb91234fe302f186c6c8e959`
- `createReportTemplateAction` → `4003a5ab14a0f92a0a6016bc1bd33893d25fe0b57e`
- `createUserAction` → `401b3d07a800e1cc8e050ecb40e4eca58e9eb5b88c`
- `exportAuditProgram` → `40f31732d2f52acee32ce8960ba4cc6255bb479762`
- `exportDeclarations` → `40212a7bd36b376b94442bf3d39e2cbd0236fc04d0`
- `exportEngagement` → `404b3a19edae6399ba1e79dd8b5ceac6c067301177`
- `exportFieldwork` → `403ad5644f4377b541ef2c7ac91a38f89dee7e379c`
- `exportPlanning` → `40a64230a6e6fcb75a671c217d1738a689a1bac50b`
- `exportReport` → `40d05ffea3eca7d86838a0390c642efa7a4edcc420`
- `getAuditLogs` → `60841d4c9f5135cd047e388776d9748c3c54e73df3`
- `getPlannedEngagement` → `407be3a5a0ae1c5a13391a4070bc0ad0df59fb3ce7`
- `invalidateCacheAction` → `7f4c367a65865d7945797b193a941a4b82bdb57d16`
- `removeDelegatedPreparer` → `4033506180c1f5731d746a33a57382e55718250a9d`
- `submitDeclarations` → `40a95a9e9e933b83f2d79025f75642b3f2e43bab23`
- `toggleDeclarationAction` → `4093e8aae8c2586dac09361d13c1d914dc2a6cf118`
- `toggleDeclarationSectionAction` → `40da4fe590f29273f1bd6d5ec51f30da47cecdb01d`
- `toggleUserAction` → `4058491046db47264a81caf96a46ac2addd916f4ad`
- `updateAnnualAuditPlanAction` → `6006226bcc074ac3ee8e6865557418f6691bd6225b`
- `updateAnnualAuditPlanPeriodAction` → `6014ab184dba431a087b39f9ae16d5ac3608b0d697`
- `updateDeclaration` → `60ac682385508c82ac42e0829bfacaeb16e0875c45`
- `updateDeclarationCustomText` → `404813801c373de5c47668607d94706bebb1858e69`
- `updateDeclarationSection` → `6040348c5d286acbe83458f1355a85ff8f9bef2c15`
- `updateDeclarationSectionCustomName` → `40602a130b924342142c7e4994ddc815b3ae22923e`
- `updateEngagementAction` → `609af0e0609e905fda98f4e93c2b6c38b18a48f576`
- `updateEngagementAuditProgramItemAction` → `60e8e6a70216eba4f94a3b326e07c5c22b82c89be5`
- `updateEngagementFieldworkDocumentAction` → `601f25fffc2f5714814501e90921e1025a36655fef`
- `updateEngagementPlanningDocumentAction` → `604c065414ae5e715568820fa075703fb06e78d40c`
- `updateEngagementReportDocumentAction` → `6027d6ade848bff5ae93a34e5c1be1422361ac895b`
- `updateEngagementTypeAction` → `608afb311425f310737d56dff8082c4926712deaab`
- `updateGuidingDocumentAction` → `6072347c2f915ecf43baaca1993697cbc3ca721d48`
- `updatePlannedEngagementAction` → `70426c2bc64e5adfe60e4ddedf05267edad66f0b18`
- `updatePlanningTemplateAction` → `609d73b0ef68dd4b09f786903a3878b2c886ac2ef2`
- `updateReportTemplateAction` → `601980d064e2cdb6a85c7976db2a87223b2b847ea3`
- `updateUserAction` → `60428562beec1adb24c039b2215b0eac058d86ecd4`

## Zod form schemas (verbatim, by route)

### 2993-f7d7813de5bfb617.js (`2993-f7d7813de5bfb617.js`)

```ts
({value:a.z.string(),label:a.z.string()})
```
```ts
({name:a.z.string(),url:a.z.string(),type:a.z.string().nullable()})
```
### /admin/periods (`page-1ee727010d35c44c.js`)

```ts
({name:p.z.string().min(1,{message:"Name is required"}).max(100,{message:"Name must be at most 100 characters"}),description:p.z.string().max(100,{message:"Description must be at most 100 characters"}),startDate:p.z.date({required_error:"Start date is required",invalid_type_error:"Start date is invalid"}),endDate:p.z.date({required_error:"End date is required",invalid_type_error:"End date is invalid"})})
```
### /admin/declarations (`page-22e561663ee50b41.js`)

```ts
({declarationSectionId:b.z.string(),declarationText:b.z.string(),customText:b.z.string()})
```
```ts
({name:b.z.string(),description:b.z.string(),customName:b.z.string()})
```
### /templates/reporting (`page-2833ee1a39f9ba7d.js`)

```ts
({name:h.z.string().min(1,"Name is required"),required:h.z.literal("false"),reference:h.z.string().min(1,"Reference is required").regex(/^[D0-9]+$/,"Reference must be uppercase letters and numbers").regex(/^(?!D1|D2|D3$).*$/,"Reference cannot be D1, D2, or D3. D1 will be used for the Schedule of Findings and Recommendations."),files:h.z.union([h.z.array(p.NJ.or(p.d_)),p.NJ.or(p.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(h.z.array(p.NJ.or(p.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed"))})
```
```ts
({name:h.z.string().min(1,"Name is required"),required:h.z.literal("true"),reference:h.z.string().min(1,"Reference is required").regex(/^(?!D1$).*$/,"Reference cannot be D1").regex(/^[D0-9]+$/,"Reference must be uppercase letters and numbers"),files:h.z.union([h.z.array(p.NJ.or(p.d_)),p.NJ.or(p.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(h.z.array(p.NJ.or(p.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed"))})
```
### /admin/users (`page-3e59f6f697eab745.js`)

```ts
({firstName:f.z.string().min(1,{message:"First Name is required"}).max(100,{message:"First Name must be at most 100 characters"}),lastName:f.z.string().min(1,{message:"Last Name is required"}).max(100,{message:"Last Name must be at most 100 characters"}),email:f.z.string().email({message:"Invalid email address"}),role:f.z.string().min(1,{message:"Role is required"}).max(100,{message:"Role must be at most 100 characters"})})
```
```ts
({userId:f.z.string().min(1,{message:"User ID is required"})})
```
### /engagements/[engagement_id] master data (incl. add) (`page-40f724b91b86fedd.js`)

```ts
({annualAuditPlanId:x.z.string().min(1,"Annual Audit Plan is required"),plannedEngagementId:x.z.string().optional(),engagementName:x.z.string().min(1,"Engagement Name is required"),engagementNumber:x.z.string().min(1,"Engagement Number is required"),engagementTypeId:x.z.string().min(1,"Engagement Type is required"),startDate:x.z.date(),endDate:x.z.date().min(new Date,"End Date cannot be in the past").optional(),engagementBudget:x.z.coerce.number().min(0,"Engagement Budget must be greater than 0"),engagementSpend:x.z.coerce.number().min(0,"Engagement Spend must be greater than 0").optional(),outsourcedParty:x.z.string().min(1,"Outsourced Party is required"),engagementAuditors:x.z.array(x.z.object({userId:x.z.string().min(1,"User is required"),positionOnAudit:x.z.nativeEnum(v.EngagementAuditorRole),qualifications:x.z.string().min(1,"Qualifications are required"),experience:x.z.string().min(1,"Experience is required")})).optional()})
```
### /admin/engagement-types (`page-4c06d9483d3fe72e.js`)

```ts
({name:p.z.string().min(1,{message:"Name is required"}).max(100,{message:"Name must be at most 100 characters"}),description:p.z.string().max(100,{message:"Description must be at most 100 characters"}),disabled:p.z.boolean().optional()})
```
### /admin/delegated-preparers (`page-7660398b48dd6009.js`)

```ts
({userId:N.z.string(),isAdd:N.z.boolean()})
```
### /templates/planning (`page-a78cf15c8ecb49ad.js`)

```ts
({name:p.z.string().min(1,"Name is required"),required:p.z.literal("false"),reference:p.z.string().min(1,"Reference is required").regex(/^[A0-9]+$/,"Reference must be uppercase letters and numbers").regex(/^(?!A1|A2|A3|A4$).*$/,"Reference cannot be A1, A2, A3, or A4. A4 will be used for the Audit Program."),files:p.z.union([p.z.array(h.NJ.or(h.d_)),h.NJ.or(h.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(p.z.array(h.NJ.or(h.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed"))})
```
```ts
({name:p.z.string().min(1,"Name is required"),required:p.z.literal("true"),reference:p.z.string().min(1,"Reference is required").regex(/^(?!A4$).*$/,"Reference cannot be A4").regex(/^[A0-9]+$/,"Reference must be uppercase letters and numbers"),files:p.z.union([p.z.array(h.NJ.or(h.d_)),h.NJ.or(h.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(p.z.array(h.NJ.or(h.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed"))})
```
### /engagements/[id]/planning (`page-aa05252f5fc9cff5.js`)

```ts
({documentReference:h.z.string().min(1,"Document reference is required").regex(/^A\d+$/,"Document reference must start with 'A' followed by digits"),name:h.z.string().min(1,"Name is required"),description:h.z.string(),files:h.z.union([h.z.array(v.NJ.or(v.d_)),v.NJ.or(v.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(h.z.array(v.NJ.or(v.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed")),engagementId:h.z.string().min(1,"Engagement ID is required"),nominatedReviewerId:h.z.string().min(1,"Nominated reviewer ID is required"),templateId:h.z.string().optional()})
```
### /annual-audit-plan/[aap_id] (incl. add plan + add planned-engagement) (`page-abbadb2bcedb6435.js`)

```ts
({name:v.z.string().min(1,{message:"Name is required"}).max(100,{message:"Name must be at most 100 characters"}),description:v.z.string().max(100,{message:"Description must be at most 100 characters"}),periodId:v.z.string().min(1,{message:"Period is required"})})
```
```ts
({name:v.z.string().min(1,"Name is required"),reference:v.z.string().min(1,"Reference is required"),engagementTypeId:v.z.string().min(1,"Engagement type is required"),objectives:v.z.string().min(1,"Objectives are required"),scope:v.z.string().min(1,"Scope is required"),location:v.z.string().min(1,"Location is required"),assignedSeniorAuditorId:v.z.string().min(1,"Senior auditor is required"),plannedStartDate:v.z.date(),plannedEndDate:v.z.date(),plannedBudget:v.z.number().min(0),actualStartDate:v.z.date().optional(),actualEndDate:v.z.date().optional(),actualSpend:v.z.number().optional()})
```
### /engagements/[id]/reporting (`page-b58d8e32623422b3.js`)

```ts
({documentReference:h.z.string().min(1,"Document reference is required").regex(/^D\d+$/,"Document reference must start with 'D' followed by digits"),name:h.z.string().min(1,"Name is required"),description:h.z.string(),files:h.z.union([h.z.array(v.NJ.or(v.d_)),v.NJ.or(v.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(h.z.array(v.NJ.or(v.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed")),engagementId:h.z.string().min(1,"Engagement ID is required"),nominatedReviewerId:h.z.string().min(1,"Nominated reviewer ID is required"),templateId:h.z.string().optional()})
```
### /engagements/[id]/fieldwork (`page-d0fdba498930bd36.js`)

```ts
({documentReference:v.z.string().min(1,"Document reference is required").regex(/^B\d+(?:\.\d+)?$/,"Document reference must start with 'B' followed by digits and optionally a dot and more digits"),name:v.z.string().min(1,"Name is required"),description:v.z.string(),files:v.z.union([v.z.array(p.NJ.or(p.d_)),p.NJ.or(p.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(v.z.array(p.NJ.or(p.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed")),engagementId:v.z.string().min(1,"Engagement ID is required"),nominatedReviewerId:v.z.string().min(1,"Nominated reviewer ID is required"),templateId:v.z.string().optional()})
```
### /engagements/[id]/audit-program (`page-e121e37c9d0951be.js`)

```ts
({riskReference:p.z.string().min(1,"Risk reference is required").regex(/^R\d+$/,"Risk reference must start with 'R' followed by digits"),risk:p.z.string().min(1,"Risk is required"),auditObjective:p.z.string().min(1,"Audit objective is required"),auditProcedure:p.z.string().min(1,"Audit procedure is required"),engagementId:p.z.string().min(1,"Engagement ID is required"),engagementFieldworkDocumentGroupReference:p.z.string().optional(),nominatedReviewerId:p.z.string().min(1,"Nominated reviewer ID is required")})
```
### /guiding-documents (`page-f69b936c0ca2cdb0.js`)

```ts
({name:f.z.string().min(1,"Name is required"),description:f.z.string(),files:f.z.union([f.z.array(h.NJ.or(h.d_)),h.NJ.or(h.d_)]).transform(e=>Array.isArray(e)?e:[e]).pipe(f.z.array(h.NJ.or(h.d_)).min(1,"At least one file is required").max(1,"Maximum of 1 file is allowed"))})
```
### /engagements/[id]/auditor-declarations (`page-f70d346efa846230.js`)

```ts
({engagementId:P.z.string().min(1,{message:"Engagement is required"}),declarations:P.z.array(P.z.object({declarationId:P.z.string().min(1,{message:"Declaration is required"}),confirmed:P.z.boolean().refine(e=>e,{message:"Declaration must be confirmed"})}))})
```
