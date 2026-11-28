# PrepWise architecture diagrams

These Mermaid diagrams describe the implementation represented by the source tree.

## Prompt workflow and task decomposition

```mermaid
flowchart TD
  A[Student input] --> B[Zod input validation]
  B --> C[P1: study-priority analysis]
  C --> D[Validate P1 schema and subject/topic preservation]
  D --> E[P2: timetable generation]
  E --> F[Zod timetable parsing]
  F --> G[Independent timetable validator]
  G -->|Valid| H[Return plan to UI]
  G -->|Invalid and attempts remain| I[P3: inject errors and warnings]
  I --> E
  G -->|Invalid and limit reached| J[Return structured error; no plan]
```

## Input–output flow

```mermaid
flowchart LR
  A[Subjects and topics] --> D[Express API]
  B[Exam dates and priorities] --> D
  C[Availability and preferences] --> D
  D --> E[Groq structured responses]
  E --> F[Zod parsing and rule validation]
  F --> G[Validated timetable JSON]
  G --> H[React plan view]
  H --> I[Browser localStorage]
```

## System architecture

```mermaid
flowchart TB
  U[Browser] --> FE[React + Vite UI]
  FE -->|POST /api/study-plans/generate| API[Express API]
  API --> Z[Zod input schema]
  API --> S[Study plan service]
  S -->|P1/P2/P3 requests| GROQ[Groq API: openai/gpt-oss-120b]
  S --> V[Timetable validator]
  V -->|valid plan or structured error| API
  API --> FE
  FE --> LS[Browser localStorage]
  ENV[Server environment: GROQ_API_KEY] --> GROQ
```

## Scope note

The product does not use a retrieval-augmented generation pipeline or a separate autonomous agent loop. The workflow is a chained prompt process with deterministic validation and bounded correction.