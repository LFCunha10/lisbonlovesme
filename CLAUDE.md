# Project conventions for Claude

## Internationalization

**Every user-facing string must exist in all three supported languages: `en`, `pt`, `ru`.**

Translation files live in `client/src/i18n/locales/{en,pt,ru}.json`.

When adding any new copy:
1. Add the key + value to all three locale files (do not skip `ru`).
2. Reference it via `t('namespace.key')` from `react-i18next` — never hardcode user-visible strings.
3. Match the existing key nesting (e.g. `home.subtitle`, `navigation.main.tours`).

## Typography

The brand logo (`.brand-logo`) must always render in **DM Serif Display**, regardless of the active language. Per-language font overrides apply to body / heading copy but not to the brand mark.
