import { serve, Server, ServerRequest } from "../deps.ts";
import { tasty } from '../tasty.ts';

const s: Server = serve({ port: 8000 });

let router = new tasty.Router();

// Serve a static endpoint
router.on({
    method: 'get',
    path: '/',
    handler: (request: ServerRequest) => {
        request.respond({ body: `Hello World!` })
    }
});

// Serve a dynamic permalink
router.on({
    method: 'get',
    path: '/:name', 
    handler: (request: ServerRequest, query) => {
        request.respond({ body: `Hello ${query.get("name")}` })
    }
});

console.log("🍦 tasty! 🍦")
console.log("Serving up some tasty routes")

for await (const request of s) {
    router.route(request);
}


