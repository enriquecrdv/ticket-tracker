<!-- MEMANTO-MANAGED-SECTION -->
<!-- memanto-template-version: 1.0.0 -->
## MEMANTO - Your Active Memory Companion

> **CRITICAL DIRECTIVE**: You are an agent equipped with Memanto. Without it, you are amnesiac. You have zero memory between chat sessions. Your ability to learn and adapt depends ENTIRELY on you actively writing to Memanto.

Every memory operation in this session goes through MEMANTO. There is no exception. All memanto commands are **shell commands**. Always run them using the Bash tool. Never simulate, describe, or "pretend to call" them.
> **Note**: The `memanto-memory` skill contains reference guidelines only (best practices, confidence levels, tagging). It is NOT executable — always use Bash for memanto commands.

### 1. ENVIRONMENT-AWARE EXECUTION PROTOCOL
Before you write any code or provide a final answer, you MUST evaluate if the current context contains new memory triggers.

You must actively evaluate:
1. PREFERENCE: Did the user state a [USER PREFERENCE / RULE]? (e.g., code formatting style, choice of library, or tool preference)
2. GOAL: Did we establish or reach a [GOAL / MILESTONE]? (e.g., target feature completion, roadmap deliverable, or sprint objective)
3. FAILURE: Did we learn a [CORRECTION / FAILURE LESSON] from an error, tool, or test? (e.g., a bug fix workaround, error post-mortem, or test failure insight)
4. SYSTEM: Did we uncover a [DOMAIN INVARIANT / SYSTEM QUIRK]? (e.g., a technical constraint, API quirk, or dependency behavior)
5. ENVIRONMENT: Was a key [ENVIRONMENT FACT] verified? (e.g., OS behavior, path layout, or tool version requirement)

**How to Execute the Evaluation:**
- **If you are operating in Native CLI & Integrated IDE Environments (Claude Code, Cursor, Windsurf, Gemini CLI, Cline, Roo, Continue, OpenCode, Codex, Aider, or Anthropic Web UI):**
  You MUST perform this evaluation inside a `<thinking>` block at the very start of your turn.
- **If you are operating in VS Code Agent Environments (VS Code Copilot or VS Code Extension Agent Mode):**
  [CRITICAL SEQUENCE]: You MUST execute the following three steps in exact order ONCE at the very beginning of your turn (immediately after the user's prompt). Do NOT repeat this check before subsequent tool calls in the same turn.
  - **Step 1:** You MUST invoke the terminal tool with the dummy command `echo "memory check"`. You will use this tool call's `explanation` parameter to silently write out your step-by-step evaluation WRAPPED inside a `<thinking>` XML tag.
  - **Step 2:** If your evaluation in Step 1 found a matching trigger, your next immediate tool call MUST be `memanto remember`.
  - **Step 3:** Only AFTER Step 1 (and Step 2 if applicable) are complete, you may proceed to execute productive tools or output normal chat text.
### 2. THE ABSTRACTION RULE (HOW TO THINK ABOUT MEMORY)
Users speak naturally and implicitly. When you store a memory, **ELEVATE IT TO A PRINCIPLE**.
- **WRONG (Activity Log)**: "User told me to use functional components."
- **RIGHT (Universal Principle)**: "Exclusively use functional components for React UI."
Do not record the conversation. Record the universal rule.

### 3. THE DURABILITY TEST (WHAT NOT TO STORE)
Before storing, ask yourself: *"Will this generalized principle fundamentally change how I generate code for this user 3 months from now?"*
- **DO NOT STORE**: Step-by-step progress, routine bug fixes, UI tweaks, temporary code snippets, or literal chat summaries.

### 4. RECALL TRIGGER MATRIX (WHEN TO SEARCH MEMORY)
Do not guess or write code blindly. Run `memanto recall` (or `memanto answer`) using the Bash tool before acting if any of the following occur. Always pass `--tool claude-code` on these reads: they carry no `--source`, and that flag is how Memanto identifies you as the calling agent.
- **[TASK INITIATION]** Before starting a complex feature, refactor, or multi-file architecture task, search for relevant stack constraints, rules, and prior decisions.
- **[AMBIGUOUS REPAIR / ERROR]** When facing a cryptic build failure, test failure, or environment bug, search memory for past workarounds and error post-mortems.
- **[UNSTATED PREFERENCE]** When about to choose a library, pattern, or naming convention that isn't specified in the prompt, search memory to see if a preference was established in an earlier session.
- **[EXPLICIT USER QUESTION]** When the user asks "What did we decide about X?", "Check memory", or "Recall context", run `memanto recall` (or `memanto answer`) immediately.
- **[FRESH SESSION / CONTEXT REFRESH]** At session start or after switching tasks, run `memanto recall --recent --tool claude-code` to retrieve active task state and recent commitments.

### 5. HOW TO EXECUTE
For all command syntax, required flags, memory types, tagging best practices, and CLI options, refer to the `memanto-memory` SKILL.md. You MUST read this skill before running any memory operations if you do not know the exact command schema.

<!-- /MEMANTO-MANAGED-SECTION -->

<!-- MEMANTO-DYNAMIC-MEMORIES -->
<!-- /MEMANTO-DYNAMIC-MEMORIES -->
