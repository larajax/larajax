# Larajax - AJAX for Laravel

<p align="center">
    <a href="https://larajax.org" target="_blank">
        <img src="https://github.com/larajax/larajax/blob/main/logo.png?raw=true" alt="Larajax" width="25%" height="25%" />
    </a>
</p>

[Larajax](https://larajax.org) is a small AJAX framework for Laravel with a single goal:
to make server-driven UI actions simple again. Modern stacks often turn basic interactions into layers of APIs, JavaScript state, and wiring. Larajax pulls that logic back into the controller and treats rendered HTML as the source of truth.

Larajax lets your HTML call **Laravel controller methods** directly using `data-request`.
No public API routes. No duplicated endpoints. Each page keeps its own actions.

Extracted from the original [October CMS AJAX framework](https://docs.octobercms.com/4.x/ajax/introduction.html) and maintained by the [October CMS team](https://github.com/octobercms).

## Learning Larajax

The best place to learn Larajax is by [reading the documentation](https://larajax.org).

## Features

- Define AJAX handlers directly inside controllers (`onSave`, `onSendMessage`).
- Trigger handlers from HTML using `data-request`.
- Call handlers programmatically using `jax.ajax()`.
- Update view fragments without wiring `fetch()` by hand.
- Keep internal actions local to the page controller.
- One page route instead of many internal endpoints.
- Built-in CSRF protection, validation, and error handling.
- Works with Laravel Blade and October CMS.

## Why Larajax Exists

Most Laravel apps end up with two parallel systems:

- Page routes for HTML
- API routes for internal actions

This splits logic across controllers, routes, and JavaScript files. Simple UI actions turn into global endpoints with unclear ownership.

Larajax flips that model.

- One page route
- All actions live in the same controller
- Actions stay private to the page that uses them
- No internal REST APIs to manage

You read the flow in one pass. You always know where things live.

## How It Works

Larajax exposes small controller methods as local AJAX handlers. They look like API endpoints but only exist within the page controller.

On the client side, Larajax includes a thin JavaScript helper.

- Your markup triggers requests using `data-request`
- Larajax sends the request
- The response is applied to the page

When markup is not enough, the same handlers can be called with `jax.ajax()`.

---

## Hello World

### View

```html
<form data-request="onSave">
    <input name="first_name" />

    <button type="submit">
        Save
    </button>
</form>

<div id="message"></div>
```

### Controller

```php
use Larajax\LarajaxController;

class ProfileController extends LarajaxController
{
    public function index()
    {
        return view('profile');
    }

    public function onSave()
    {
        request()->validate([
            'first_name' => 'required'
        ]);

        return ajax()->update([
            '#message' => 'Saved successfully!'
        ]);
    }
}
```

### Flow

- Form fires `onSave`
- Controller runs
- Input validates
- DOM updates
- No JS written

---

## Foundation library

The CMS uses [Laravel](https://laravel.com) as a foundation PHP framework.
