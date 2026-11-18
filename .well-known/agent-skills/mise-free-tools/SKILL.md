---
name: mise-free-tools
description: Work out kitchen back-office figures with the free Mise tools - check a supplier invoice line by line, estimate panic spend from emergency top-up buying, and calculate the unit cost of an ingredient from its pack price and size. Use when a user asks about an invoice discrepancy or overcharge, emergency or top-up purchasing costs, per-unit or per-pack ingredient costs, or wants a quick kitchen cost check before talking to Mise.
---

# Mise free tools

Mise is Product 01 of Antigravity Analytics: software that runs the back of a kitchen - recipes, orders, stock, and bills in one place, with a person approving every order before anything is bought. Mise is in build and has no paying customers yet.

These three free tools each do one small check by hand, the way the full product will do it on every order:

## 1. Invoice check

Use when a user has a supplier invoice and wants to know whether the lines add up and match what was agreed.

Gather:
- Each invoice line: item, quantity, unit price, and line total as printed.
- The agreed price for each item, if the user has it (order, quote, or price list).
- Any credits, discounts, or charges shown on the invoice.

What the output means: each line is re-multiplied (quantity x unit price) and compared with the printed line total, the invoice total is re-added, and any line priced above the agreed price is flagged with the difference. A flagged line is a question to raise with the supplier, not proof of intent - quantities received and agreed prices should be confirmed before disputing anything.

## 2. Panic-spend estimate

Use when a kitchen buys ingredients in emergency top-ups (small, urgent, full-price purchases) and the user wants to know what that habit costs.

Gather:
- How often top-up buying happens (per week or per month).
- Roughly how much is spent on a typical top-up.
- If known, the same items' normal ordered price, so the premium can be separated from the base cost.

What the output means: an estimate of total panic spend over the period and, where prices are known, the premium paid over planned ordering. It is an estimate built from the user's own figures - treat it as a size-of-the-problem number, not an audited figure.

## 3. Pack unit cost

Use when a user knows a pack price and pack size and needs the true unit cost to price a recipe or compare suppliers.

Gather:
- Pack price as paid.
- Pack size and unit (weight or volume as printed on the pack).
- The unit the user wants the cost in (for example per gram, per 100 g, per ml, or per piece, with pieces per pack).

What the output means: pack price divided by pack size, expressed in the requested unit. Shrinking pack sizes at the same price raise the unit cost - comparing unit costs, not pack prices, is what exposes that.

## Honest stage note

The tools run on a Mise MCP server that is built and verified locally but is NOT yet hosted on a public endpoint, so there is no endpoint URL to connect to yet and this skill must not invent one. Until the server is hosted, use this skill as the method guide: gather the inputs above, do the arithmetic carefully, and show your working.

## Going further

- Mise itself: https://antigrav.si/mise - pricing is not published; pricing is discussed on a call only, and the call can be booked from that page.
- Privacy for the free tools: https://antigrav.si/mise-plugin-privacy.html
- Terms for the free tools: https://antigrav.si/mise-plugin-terms.html
- Contact: hello@antigrav.si
