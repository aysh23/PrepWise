# Test data and saved-output index

The Milestone 2 test table contains 12 distinct validator inputs. They are deterministic, constructed test cases based on a fixed fixture (planning date 2099-12-21; exam date 2099-12-31); they are not live student records or live model calls.

- Canonical fixture and assertions: `server/test/timetableValidator.test.js`
- P1/P3 mocked service fixture: `server/test/refinementService.test.js`
- Human-readable case matrix: `docs/milestone2/test-evidence.md`

The actual generated fixture is asserted by the test code. No live provider response transcript is included because the repository evidence does not preserve a raw live P1/P2/P3 transcript. Do not treat a mocked response as a live run.