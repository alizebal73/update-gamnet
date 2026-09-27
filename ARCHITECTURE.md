# UI Prototype Architecture

This repository is the standalone UX/interaction reference for the CyberCafe operator UI.

## Runtime structure

- `index.html` — minimal document shell and script/style entry points.
- `src/styles.css` — prototype styling.
- `src/core.js` — base data, navigation/render helpers, accessibility foundation, common UI helpers.
- `src/accounts.js` — customer profile/account center, wallet/debt/free-credit/discount flows and account context actions.
- `src/sessions.js` — resource selection, session lifecycle, pause/transfer/extend/lock/ban/security actions.
- `src/finance.js` — VIP, pricing, persistence/journal, shared-time-pool and financial state helpers.
- `src/people.js` — customer and staff management screens and permission editing.
- `src/hotkeys.js` — operator hotkeys and hotkey-driven customer/account actions.
- `src/system.js` — device/game/tools/reports/payments/settings/backup/recovery/license/update/tariff utilities.
- `src/bootstrap.js` — final runtime bootstrap and clock/render initialization.

All JavaScript files are intentionally loaded as classic scripts so the prototype can preserve its existing global action handlers while remaining split by responsibility.

## Production merge rule

This prototype is a UX reference only. The production Vue dashboard must not copy this global-script architecture or use the prototype's mutable browser state as a financial source of truth. Production code should remain componentized and server-confirmed, as defined in the Col Cafe production merge contract.
