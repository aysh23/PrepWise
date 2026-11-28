# V3 — Structured output, independent validation and refinement

**Version:** V3  
**Purpose:** Make model output machine-readable and enforce hard scheduling constraints outside the model.  
**Status:** Implemented in the application source.

V3 retains the V2 P1 and P2 instructions and adds:
1. Strict JSON-schema response formats to the Groq Chat Completions requests.
2. Zod parsing of the P1 analysis and P2/P3 timetable objects.
3. An independent timetable validator for dates, examination deadlines, unavailable weekdays, daily time window, duration, activity types, known subjects/topics, overlaps, breaks, daily limits and mandatory topic coverage.
4. A bounded correction call when validation reports errors or warnings.

## P3 — Dynamic validation-guided refinement suffix

The backend reuses the P2 timetable-generation system prompt and appends the following runtime suffix:

Refinement required: the previous timetable failed programmatic validation. Correct every listed error and coverage gap and preserve all hard constraints.

Validation errors and coverage gaps:
{validation.errors as JSON}

Validation warnings:
{validation.warnings as JSON}

Do not return an explanation instead of the JSON timetable.

## Why it changed

A schema-valid JSON object can still violate a student's dates, availability or topic constraints. V3 adds independent checks and passes concrete validation feedback back to the model for a bounded correction. If the plan remains invalid after the configured attempts, the backend rejects it instead of returning an invalid timetable.

## Evidence boundary

The repository contains automated tests for schema/service/validator behavior. The refinement service test uses mocked model responses. It is not evidence of a live provider call or a measured quality improvement over V1.