# E0-S1: Home Navigation Shell

Epic: [Epic 0](../epics/EPIC-0-foundation-and-app-shell.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want a clear home-based app structure so I can move between today, logging, history, and insights without getting lost.

## Depends On

- none

## Unblocks

- nearly every later UI story

## Implementation Notes

- split `mobile/App.js` into screen-oriented components
- create entry points for `Home`, `Log`, `History`, and `Insights`
- keep the current load visualization reachable from an appropriate destination

## Acceptance Criteria

- the app has dedicated entry points for `Home`, `Log`, `History`, and `Insights`
- the default landing screen is `Home`
- moving between screens does not reset in-progress form input unexpectedly
- the current visualization remains accessible

## Test And Verification

- navigation behavior tests where practical
- iPhone simulator screenshots for the shell
- Maestro smoke path across the top-level destinations
