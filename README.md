# Larajax - AJAX for Laravel

<p align="center">
    <a href="https://larajax.org" target="_blank">
        <img src="https://github.com/larajax/larajax/blob/main/logo.png?raw=true" alt="Larajax" width="25%" height="25%" />
    </a>
</p>

[Larajax](https://larajax.org) is a small AJAX framework for Laravel, built with a single goal: to bring simplicity back to Laravel development. Modern stacks often turn basic interactions into layers of APIs, JavaScript state, and wiring. Larajax pulls that logic back into the controller and treats rendered HTML as the source of truth.

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

## Foundation library

Larajax uses [Laravel](https://laravel.com) as a foundation PHP framework.

## License

Larajax is open-sourced software licensed under the [MIT license](LICENSE.md).
