# Larajax - AJAX for Laravel

<p align="center">
    <a href="https://larajax.org" target="_blank">
        <img src="https://github.com/larajax/larajax/blob/main/logo.png?raw=true" alt="Larajax" width="25%" height="25%" />
    </a>
</p>

[Larajax](https://larajax.org) is a small AJAX framework for Laravel, built with a single goal: to bring simplicity back to Laravel development. Modern stacks often turn basic interactions into layers of APIs, JavaScript state, and wiring. Larajax pulls that logic back into the controller and treats rendered HTML as the source of truth.

Extracted from the original [October CMS AJAX framework](https://docs.octobercms.com/4.x/ajax/introduction.html) and maintained by the [October CMS team](https://github.com/octobercms).

## About Larajax

Larajax lets you define AJAX handlers directly inside Laravel controllers and trigger them from HTML using simple `data-request` attributes -- no separate API routes required.

```php
// One route, multiple handlers
Route::any('/profile', [ProfileController::class, 'index']);

class ProfileController extends LarajaxController
{
    public function onUpdateProfile() { /* ... */ }
    public function onDeleteAccount() { /* ... */ }
}
```

```html
<button data-request="onUpdateProfile">Save</button>
```

### Key Features
- 📦 Define AJAX handlers directly in controllers
- 🎯 Trigger handlers from HTML with `data-request`
- 🔄 DOM patching without manual fetch wiring
- ✅ Built-in CSRF, validation, and error handling
- 🧩 Reusable components system
- ⚡ Dynamic asset loading (JS, CSS, images)
- 🚀 Turbo Router for SPA-like navigation

## Installation

```bash
composer require larajax/larajax
```

## Resources

- 📚 **Documentation**: [larajax.org](https://larajax.org)
- 💻 **Source**: [github.com/larajax/larajax](https://github.com/larajax/larajax)

## License

Larajax is open-sourced software licensed under the [MIT license](LICENSE.md).
