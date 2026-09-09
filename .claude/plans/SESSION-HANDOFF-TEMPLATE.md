# Session Handoff

Mid-task continuation bridge for the NEXT session. Not the journal entry —
the journal records *why*; this records *what to do next*. Write it to
`.claude/plans/session-handoff.md` when stopping in the middle of a plan
(context budget, end of day, blocked on a question). Delete it when the plan
closes and `/journal` has run.

Quality bar: a fresh session with no access to the current conversation must
be able to execute the exact next step without re-deriving it.

Never put secrets in a handoff. Reference where they live; do not copy them.

## Plan

<one paragraph — which plan file this belongs to, what the work is for, and what "done" means>

## Current State

<which step of the plan is active; what is finished, in progress, untouched>

## Completed Files

<every file created or modified so far, one-line purpose each>

- path/to/file — purpose

## Source-Of-Truth Files

<files the next session MUST read before acting; keep minimal>

- path/to/file — why required

## Active Decisions

<decisions already made that the next session must not re-litigate>

- decision — rationale

## Blocked Questions

<open questions needing the user or an external answer>

- question — what unblocks it

## Exact Next Step

<one concrete action, executable as written — include the command or the file edit>

## Validation Performed

<commands run and their results; quote failures exactly>

- command — result

## Residual Risks

<what could be wrong despite the validation above; known gaps>

- risk — likelihood — mitigation
