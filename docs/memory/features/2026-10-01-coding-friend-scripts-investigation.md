---
title: Coding Friend Plugin Scripts Investigation
description: Verification of scripts execution and usage mechanisms in coding-friend plugin for Antigravity.
tags:
  - coding-friend
  - scripts
  - plugin
  - antigravity
created: 2026-10-01
updated: 2026-10-01
---

# Coding Friend Plugin Scripts Investigation

## Overview
Investigation into why and how coding-friend plugin scripts are executed in Antigravity.

## Findings & Behavior
1. **Hook & Helper Scripts**:
   - Location: `/home/ngoctin/.gemini/config/plugins/coding-friend/hooks/` and `lib/`.
   - Permissions: Standard `644` and `755`. Executed via `bash` directly.
   - Purpose: Direct CLI/Hook integrations, session initializations (`session-init.agy.sh`), privacy checks (`privacy-block.agy.sh`), and custom guides (`load-custom-guide.sh`).
2. **Execution Test**:
   - Running `bash load-custom-guide.sh cf-ask` exited clean (code 0).
   - Running `echo '{"invocationNum": 0, "workspacePaths": ["..."]}' | bash session-init.agy.sh` generated valid injection JSON (`injectSteps`).
   - Running `privacy-block.agy.sh` returned valid `{"decision":"allow"}` JSON.

## Root Cause of Perceived Issues
- **Hook Input Expectation**: Hook scripts require standard JSON inputs via `stdin`. Running them standalone without JSON inputs will wait for input or exit silently/with error.
- **Agent Skill Orchestration**: Skills (like `/cf-ask`, `/cf-plan`) are markdown instruction guides (`SKILL.md`) interpreted directly by the AI agent rather than executable bash scripts.
