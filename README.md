# Project 9: L'Oreal Routine Builder

L'Oreal is expanding what is possible with AI, and this app helps users browse
real L'Oreal products, select items, generate a personalized routine, and ask
follow-up questions.

## Cloudflare Worker setup

This project sends chat requests to a class-hosted Cloudflare Worker. Open
`script.js` and set `workerUrl` to the URL provided in class:

```js
const workerUrl = "https://your-class-worker.workers.dev/";
```

Do not put an API key or secret in this repository. The Worker keeps the key
secure and receives the `messages` array from the frontend.
