# 🍦 tasty! 🍦

A simple routing framework for Deno for serving simple websites. Created specifically as part of building https://crunchskills.com/

## Features
* Serve text endpoints
* Dynamic endpoints
* Simple API
* Probably lots of bugs!
* Super sweet

## Example Usage

#### web.ts:

```
import { serve, Server } from "https://deno.land/std/http/server.ts";
import { tasty } from 'https://raw.githubusercontent.com/jquave/tasty/master/tasty.ts';

const s: Server = serve({ port: 8000 });

let router = new tasty.Router();

// Serve a static endpoint
router.get('/',
    (request: ServerRequest) => request.respond({ body: `Hello World!` })
);

// Serve a dynamic permalink
router.get('/:name', 
    (request: ServerRequest, query) => request.respond({ body: `Hello ${query.get("name")}` })
);

console.log("🍦 tasty! 🍦")
console.log("Serving up some tasty routes")

for await (const request of s) {
    router.route(request);
}
```

Run with

```
deno run --allow-net web.ts
```

## Contributing

If you want to contribute to this project, feel free to make a fork, make changes on your fork, and then open a pull request here with an explanation of your changes.

## Stuff that would be cool to add

* Handlebars templates
* Static folder handling
* Authentication system with SQLite built-in
* Github authentication
