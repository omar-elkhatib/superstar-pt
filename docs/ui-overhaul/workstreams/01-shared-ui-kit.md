# Workstream 01: Shared UI Kit

## Owner

- `AI-1`

## Goal

Provide the visual primitives needed by the new screens so feature agents do not each invent their own styles.

## Scope

- create theme tokens
- create screen container/layout primitives
- create reusable card, section header, primary button, secondary button, and segmented control primitives
- define shared spacing, radius, and color usage

## Primary Touchpoints

- `mobile/src/theme/**`
- `mobile/src/components/ui/**`

## Must Not Touch

- `mobile/App.js`
- screen-specific logic modules

## Dependencies

- folder layout from `AI-0`

## Deliverables

- `AppScreen`
- `SummaryCard`
- `SectionHeader`
- `PrimaryActionButton`
- `SecondaryActionButton`
- `SegmentedControl`
- shared style tokens

## Acceptance

- components are generic enough for reuse across all three main screens
- visual language matches the Apple Health-like direction
- components avoid hardcoding screen-specific copy

## Tests

- logic-level tests only if helper behavior exists
- otherwise keep this work isolated to reusable components with stable props

## Handoff Notes

- include a short prop contract in each exported component file
