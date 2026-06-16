# QMS No Cost Quiz Angular

Angular 20 port of the Quantum Medical Supply lead generation quiz from
[`fencehopping/QMS_NoCostQuiz`](https://github.com/fencehopping/QMS_NoCostQuiz).

## What is included

- Product selection with CGM, compression, and shoes branching.
- Dynamic step numbering and locked-step validation flow.
- Personal, shipping, health history, and acknowledgement sections.
- Date of birth and phone formatting.
- Smarty address autocomplete support using the embedded key meta tag.
- Google review header with `/api/reviews` fallback content.
- QMS analytics event payloads with PII fields sanitized before ingest.
- Original visual assets and Bootstrap-based styling.

## Development

```bash
npm install
npm run start
```

Open `http://localhost:4200/`.

## Verification

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```
