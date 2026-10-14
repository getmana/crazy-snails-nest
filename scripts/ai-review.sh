#!/usr/bin/env bash
# AI review of staged changes. Opt out with SKIP_AI_REVIEW=1; override CLAUDE_BIN / AI_REVIEW_LEVEL per developer.
set -euo pipefail

if [[ "${SKIP_AI_REVIEW:-}" == "1" ]]; then
  echo "AI review skipped (SKIP_AI_REVIEW=1)."
  exit 0
fi

claude_bin="${CLAUDE_BIN:-claude}"
if ! command -v "$claude_bin" >/dev/null 2>&1; then
  echo "AI review skipped: Claude CLI '${claude_bin}' not found. Set CLAUDE_BIN to enable it."
  exit 0
fi

if ! { : </dev/tty; } 2>/dev/null; then
  echo "AI review skipped: no interactive terminal."
  exit 0
fi

if git diff --cached --quiet; then
  exit 0
fi

review_level="${AI_REVIEW_LEVEL:-low}"
# Least privilege: the staged diff is untrusted model input, so the reviewer gets read-only tools only.
available_tools="Read,Grep,Glob,Skill,Bash"
preapproved_tools=(
  "Read" "Grep" "Glob" "Skill"
  "Bash(git diff *)" "Bash(git log *)" "Bash(git show *)" "Bash(git status *)"
)

echo "→ Running AI code review (${review_level}) on staged changes..."
if ! "$claude_bin" -p "/code-review ${review_level}" \
  --tools "$available_tools" \
  --allowedTools "${preapproved_tools[@]}" \
  --permission-mode dontAsk; then
  echo "AI review failed to run; decide without it."
fi

echo ""
read -r -p "Proceed with commit? [y/N] " -n 1 answer </dev/tty
echo ""

if [[ "$answer" =~ ^[Yy]$ ]]; then
  exit 0
fi

echo "Commit aborted. Fix, re-stage, and commit again."
exit 1
