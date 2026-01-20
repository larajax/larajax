# Larajax – AJAX for Laravel

<p align="center">
    <a href="https://larajax.org" target="_blank">
        <img src="https://github.com/larajax/larajax/blob/main/logo.png?raw=true" alt="Larajax" width="25%" height="25%" />
    </a>
</p>

Larajax is a small AJAX framework for Laravel that keeps interactions inside controllers and responses.

It is designed for developers who like HTML-over-the-wire patterns, but want to stay close to Laravel’s normal request → controller → response flow, without building APIs or managing frontend state.

## About Larajax

Larajax lets you define AJAX handlers directly in Laravel controllers and trigger them from HTML using `data-request` attributes.

No API routes.
No fetch wiring.
No frontend state layer.

```php
// One route, multiple handlers
Route::any('/profile', [ProfileController::class, 'index']);

class ProfileController extends LarajaxController
{
    // Page Action
    public function index()
    {
        return view('pages.profile');
    }

    // AJAX Handlers
    public function onSave()
    {
        request()->validate([
            'first_name' => 'required'
        ]);

        // Return targeted DOM updates
        return ajax()->update([
            '#message' => "Save complete!"
        ]);
    }

    public function onDelete()
    {
        // ...
    }
}
```

```html
<!-- View -->
<form>
    <input name="first_name" />

    <button data-request="onSave">
        Save!
    </button>
</form>

<div id="message"></div>
```

One route can expose multiple interaction handlers without splitting logic across endpoints.

## Key ideas

- Controller-based AJAX handlers
- HTML as the source of truth
- Targeted DOM updates
- Standard Laravel validation and CSRF handling
- Optional reusable component system

## Installation

Install the backend package:

```bash
composer require larajax/larajax
```

Install the frontend helper:

```bash
npm install larajax
```

Then import and initialize in your JavaScript entry file:

```js
import { jax } from 'larajax';
window.jax = jax;
jax.start();
```

## Background

Larajax was extracted from the AJAX framework used in [October CMS](https://github.com/octobercms) and has been running in production applications for several years.

It is now packaged as a standalone Laravel library.

## Resources

- Documentation and examples: https://larajax.org
- Source code: https://github.com/larajax/larajax

## License

Larajax is open-sourced software licensed under the [MIT license](LICENSE.md).
