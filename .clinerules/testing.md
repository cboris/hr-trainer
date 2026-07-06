---
paths:
  - "**/*.spec.ts"
  - "**/*.test.js"
  - "src/**/*.ts"
---

# Testing & Verification Rules

1. **Test-First Execution:** When implementing new features, propose the tests before writing the implementation logic.
2. **Immediate Verification:** Do not output code without running the corresponding unit tests using the terminal tool (e.g., `npm run test`, `pytest`). 
3. **Threshold-Based Optimization:** Optimize code only when test execution takes longer than $100$ milliseconds. 
4. **Coverage Maintenance:** Ensure all new code changes maintain a minimum of $90\%$ unit test coverage.
5. **No Blind Assumptions:** Do not assume a task is complete until `git diff` shows the relevant changes and the test suite passes without errors.
6. **Error Output Feedback:** If a test fails, analyze the stack trace in the terminal before attempting a fix. Never guess at a solution; let the test runner output guide you.