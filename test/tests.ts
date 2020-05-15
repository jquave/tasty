import { tasty } from '../tasty.ts';
import { serve, ServerRequest, Server } from "../deps.ts";
import {
    assert,
    assertEquals,
    assertMatch,
    assertStrContains,
    assertThrowsAsync,
  } from "./test_deps.ts";
const { Buffer, test } = Deno;



test("Test that slug logic works as expected", async function (): Promise<void> {
    const s: Server = serve({ port: 8000 });
    let router = new tasty.Router();
    
    router.on({
        method: 'get',
        path: '/ae/', 
        handler: (req) => {
            req.respond({ body: `/a` })
        }
    });

    router.on({
        method: 'get',
        path: '/ae/:be',
        handler: (req, query) => {
            req.respond({ body: `/a2/${query.get('be')}` })
        }
    });

    router.on({
        method: 'get',
        path: '/ae/:be/:ce',
        handler: (req, query) => {
            req.respond({ body: `/a3/${query.get('be')}/${query.get('ce')}` })
        }
    });

    router.on({
        method: 'get',
        path: '/ae/be/:ce',
        handler: (req, query) => {
            req.respond({ body: `/a/b/${query.get('ce')}` })
        }
    });

    router.on({
        method: 'get',
        path: '/ae/be/:cf',
        handler: (req, query) => {
            req.respond({ body: `don't trigger me /a/b/${query.get('cf')}` })
        }
    });

    router.on({
        method: 'get',
        path: '/slasher/',
        handler: (req) => {
            req.respond({ body: `slasher1` })
        }
    });

    router.on({
        method: 'get',
        path: '/noslasher',
        handler: (req) => {
            req.respond({ body: `slasher2` })
        }
    });

    router.on({
        method: 'get',
        path: '/dubleslasher',
        handler: (req) => {
            req.respond({ body: `slasher3` })
        }
    });

    router.on({
        method: 'get',
        path: '/reversed/args/:e/:f', 
        handler: (req, query: Map<string, string>) => {
            let e = query.get("e");
            let f = query.get("f");
            req.respond({ body: `${e} ${f}` })
        }
    });

    router.on({
        method: 'get',
        path: '/params', 
        handler: (req, query: Map<string, string>, params) => {
            req.respond({
                body: `${params.get("test")} ${params.get("test2")} ${params.get("a")}`,
            });
        }
    });

    router.on({
        method: 'get',
        path: '/params/level', 
        handler: (req, query: Map<string, string>, params) => {
            req.respond({
                body: `${params.get("test")} ${params.get("test2")} ${params.get("a")}`,
            });
        }
    });

    router.on({
        method: 'get',
        path: '/params-two-question',
        handler: (req, query: Map<string, string>, params) => {
            req.respond({body: `${params.get("a")}`,});
        }
    });
    
    router.on({
        method: 'get',
        path: '/1/:2/:3/:4/:5', 
        handler: (req, query) => {
            req.respond({ body: `1${query.get('2')}${query.get('3')}${query.get('4')}${query.get('5')}` })
        }
    });

    router.on({
        method: 'get',
        path: '/1/2/3/4/5/:6', 
        handler: (req, query) => {
            req.respond({ body: `12345${query.get('6')}` })
        }
    });

    const init = async () => {
        for await (const request of s) {
            router.route(request);
        }
    }

    init();

    assertEquals(await (await fetch("http://localhost:8000/1/v2/v3/v4/v5")).text(), "1v2v3v4v5")
    assertEquals(await (await fetch("http://localhost:8000/1/2/3/4/5/v6")).text(), "12345v6")
    assertEquals(await (await fetch("http://localhost:8000/reversed/args/e1/f1")).text(), "e1 f1")
    assertEquals(await (await fetch("http://localhost:8000/ae/")).text(), "/a")
    assertEquals(await (await fetch("http://localhost:8000/ae/651")).text(), "/a2/651")
    assertEquals(await (await fetch("http://localhost:8000/ae/652/653")).text(), "/a3/652/653")
    assertEquals(await (await fetch("http://localhost:8000/ae/be/654")).text(), "/a/b/654")
    assertEquals(await (await fetch("http://localhost:8000/slasher")).text(), "slasher1")
    assertEquals(await (await fetch("http://localhost:8000/slasher/")).text(), "slasher1")
    assertEquals(await (await fetch("http://localhost:8000/noslasher")).text(), "slasher2")
    assertEquals(await (await fetch("http://localhost:8000/noslasher/")).text(), "slasher2")
    assertEquals(await (await fetch("http://localhost:8000/dubleslasher///")).text(), "slasher3")
    assertEquals(await (await fetch("http://localhost:8000///dubleslasher")).text(), "slasher3")
    assertEquals(await (await fetch("http://localhost:8000///dubleslasher///")).text(), "slasher3")
    assertEquals(await (await fetch("http://localhost:8000/params?test=hello&test2=234&a=c")).text(), "hello 234 c");
    assertEquals(await (await fetch("http://localhost:8000/params-two-question??a=2")).text(), "2");
    assertEquals(await (await fetch("http://localhost:8000/params/level?test=hello&test2=xc8)_^%^&a=1")).text(), "400 Bad Request");
    s.close();
})


