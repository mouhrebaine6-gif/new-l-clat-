# Roman B1-B2 Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a constrained B1-B2 readability pass for `ROMAN_COMPLET.txt` without changing the novel's sober style or hidden meanings.

**Architecture:** Use a deterministic script to read the Bible, roman, and 30 JSON segments; apply at most 50 curated line-level micro-corrections; regenerate audit artifacts and segment JSON from the same modification map.

**Tech Stack:** PowerShell, Node.js, UTF-8 text/CSV/JSON/Markdown.

---

### Task 1: Generate Controlled Outputs

**Files:**
- Read: `C:/Users/mouhr/Desktop/m/BIBLE.md`
- Read: `C:/Users/mouhr/Desktop/m/ROMAN_COMPLET.txt`
- Read: `C:/Users/mouhr/Desktop/m/seg_fr/*.json`
- Create: `C:/Users/mouhr/Desktop/m/simplification_b1b2/ROMAN_SIMPLIFIE.txt`
- Create: `C:/Users/mouhr/Desktop/m/simplification_b1b2/frictions.csv`
- Create: `C:/Users/mouhr/Desktop/m/simplification_b1b2/modifications.json`
- Create: `C:/Users/mouhr/Desktop/m/simplification_b1b2/RAPPORT_SIMPLIFICATION.md`
- Create: `C:/Users/mouhr/Desktop/m/simplification_b1b2/seg_fr_simplifie/*.json`

- [ ] Build a modification list capped at 50 retained level-2 corrections.
- [ ] Add at least 60 frictions total with retained and non-retained entries.
- [ ] Preserve inviolable phrases and constant terms exactly.
- [ ] Mark changed roman lines with `original -- modified`.
- [ ] Regenerate segments with modified paragraphs only.
- [ ] Verify counts, invariants, word delta, and JSON structure.
