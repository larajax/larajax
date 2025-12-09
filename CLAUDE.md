# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Larajax is a small AJAX framework for Laravel that enables server-driven UI actions. It was extracted from the October CMS AJAX framework and allows defining AJAX handlers directly in controllers (`onSave`, `onSendMessage`) that can be triggered from HTML using `data-request` attributes.

## Build Commands

JavaScript assets are built using Laravel Mix from the `resources/` directory:

```bash
cd resources
bun install
bun run dev      # Development build
bun run build    # Production build
bun run pub      # Both dev and production builds
bun run watch    # Watch mode
```

Output files go to `resources/dist/`:
- `framework.min.js` - Core AJAX functionality only
- `framework-bundle.min.js` - Full bundle with extras

## Architecture

### PHP Backend (`src/`)

- **`LarajaxController`** - Base controller class that intercepts actions to handle AJAX requests
- **`Traits/AjaxController`** - Core trait that processes AJAX handlers; can be used on any controller
- **`Traits/ViewComponent`** - Trait for creating reusable components with their own AJAX handlers
- **`Classes/AjaxRequest`** - Parses incoming AJAX requests from headers (`X-AJAX-HANDLER`, `X-AJAX-PARTIAL`, etc.)
- **`Classes/AjaxResponse`** - Fluent response builder with methods like `data()`, `update()`, `redirect()`, `error()`, `partial()`
- **`ajax()` helper** - Global function returning an `AjaxResponse` instance

AJAX handlers must follow the naming convention `on[A-Z][a-zA-Z]*` (e.g., `onSave`, `onSubmitForm`). Component handlers are prefixed with the component alias: `componentAlias::onHandler`.

### JavaScript Frontend (`resources/src/`)

- **`core/`** - Base framework controller and request builder for `data-request` attribute handling
- **`request/`** - AJAX request logic, DOM patching, asset loading, and response processing
- **`observe/`** - DOM mutation observers for dynamic control registration
- **`extras/`** - Optional features: flash messages, progress bar, form validation, loading indicators
- **`turbo/`** - Turbo-style page navigation (SPA-like behavior)
- **`util/`** - Shared utilities: events, form serialization, HTTP requests, JSON parsing

The main export (`index.js`) exposes the `jax` namespace with methods like `jax.ajax()`, `jax.request()`, `jax.flashMsg()`, etc.

### Response Flow

1. Frontend sends POST with `X-AJAX-HANDLER` header
2. `AjaxController` trait intercepts the request before the normal action
3. Handler method is located (controller method, action-prefixed method, or component method)
4. Handler returns data which gets wrapped into `AjaxResponse`
5. Response includes `__ajax` envelope with operations: DOM patches, redirects, flash messages, asset loading
