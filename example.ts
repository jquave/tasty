import { serve, Server } from "./deps.ts";
import { tasty } from './tasty.ts';

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