import { serve, Server } from "https://deno.land/std@v0.42.0/http/server.ts";
import { tasty } from 'https://raw.githubusercontent.com/jquave/tasty/master/tasty.ts';

const s: Server = serve({ port: 8000 });

let router = new tasty.Router(s);

// Serve a static endpoint
router.on('/', (req) => {
    req.respond({ body: `Hello World!` })
});

// Serve a dynamic permalink
router.on('/:name', (req, query) => {
    req.respond({ body: `Hello ${query.get("name")}` })
});