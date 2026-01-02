# Finn RN + Supabase Migration Plan

Goal:
- Full rewrite to React Native (iOS/Android) with Supabase replacing all API + Firebase data/auth usage, offline-first, OWASP Top 10 alignment.

Success Metrics:
- Feature parity checklist complete for critical user journeys.
- Agreed coverage targets met (unit/integration/e2e).
- Offline baseline: cached reads available offline, queued writes sync reliably with deterministic conflicts.

Constraints / Assumptions:
- Full rewrite; no historical data migration.
- Auth providers: Google (iOS/Android) + Apple (iOS).
- Offline rules: basic cache strategy (read-through cache + queued writes).
- Expo prebuild once; native projects managed manually after.

Options:
1) Supabase-first (schema/RLS/storage/edge functions) then RN UI - lower integration risk, slower visible UI.
2) UI-first with mock data + parallel Supabase build - faster UI progress, higher rework risk.

Recommendation:
- Hybrid: define Supabase contracts early and build UI in parallel with contract tests.

Plan (Phased):
1) Discovery & Architecture Definition - feature parity map, data model, offline rules, test targets, CI/CD blueprint.
2) Supabase Foundation - tables, RLS, storage, auth providers, seed data, integration tests.
3) RN/Expo Core - navigation, design system, local cache + sync queue, auth wiring.
4) Feature Parity Build-Out - prioritized journeys with offline behavior and tests.
5) Hardening & Release - OWASP checks, performance baselines, staged rollout.

Risks & Mitigations:
- Offline sync complexity -> define conflict policy early + integration tests.
- RLS mistakes -> least-privilege policies + RLS test suite.
- Prebuild-once constraint -> lock Expo SDK + document native changes.

Validation & Quality:
- Tests: unit (domain/data), integration (Supabase + sync), e2e (critical journeys).
- TDD: apply to repository contracts and sync logic.
- Performance: cold start, feed render, image load, sync latency targets.

Open Questions / Decisions Needed:
- Timeline, team size/roles.
- Coverage targets and test pyramid split.
- Top 10 parity journeys.
- Offline cache TTL + conflict policy.
- Analytics/crash reporting choice and notifications scope.
