# SoW Checklist sizer

A standalone mock of the SoW Driftline Checklist (Night theme, demo names only) for tuning sizes on a real phone.
Live: https://steph1420.github.io/sow-sizer/ — no app data, no sheet, no tokens.

- **View mode**: tick/untick, undo/redo, Pending filter, 1|2 date columns, tap a date tab to select it, A–Z rail jumps.
- **Edit mode** (✎ Edit sizes): every size as a slider with −/+, in CSS px; drag handles on the rail edge, first row,
  column boundary and header. Values under 13 px text / 44 px taps show a ⚠ warning but are allowed.
  Reset returns to the defaults: Steve's saved values ("Mine", phone 360x652 @3). One-tap built-ins:
  **Mine**, **Suggested** (design fixes, `src/presets.ts`) and **C1** (the first mock). Save as A / B and Load A / B too.
- **Collapsing header**: scrubbed 1:1 with scroll over *Collapse distance*, down to *Collapsed header height*
  (date pills + one count pill). Compositor-driven CSS scroll timeline where supported, rAF fallback (`src/collapse.ts`).

## Save and pulling the values
**Save** stores the values on the phone (localStorage), writes them into the URL hash, and copies a 3-line export:

```
SoW sizer v1 (CSS px)
{"sizer":1,"preset":"current","viewport":"449x810@2.8125","values":{"rail":32,…}}
https://steph1420.github.io/sow-sizer/#v1:rail=32,railGap=4,…
```

Paste it in chat. The JSON `values` are the sizes; the link reopens the page with exactly those values.
If the clipboard is blocked the Android share sheet opens, and failing that a select-all text box.

Sizes are defined once in `src/sizes.ts` (key, label, group, default, range, warning rule).
