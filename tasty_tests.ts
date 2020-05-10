import { tasty } from './tasty.ts';
import { serve, ServerRequest, Server } from "https://deno.land/std@v0.42.0/http/server.ts";
import {
    assert,
    assertEquals,
    assertMatch,
    assertStrContains,
    assertThrowsAsync,
} from "https://deno.land/std@v0.42.0/testing/asserts.ts";
const { Buffer, test } = Deno;



test("Test that slug logic works as expected", async function (): Promise<void> {
    const s: Server = serve({ port: 8000 });
    let router = new tasty.Router(s);
    router.on('/ae/', (req) => {
        req.respond({ body: `/a` })
    });
    router.on('/ae/:be', (req, query) => {
        req.respond({ body: `/a2/${query.get('be')}` })
    });
    router.on('/ae/:be/:ce', (req, query) => {
        req.respond({ body: `/a3/${query.get('be')}/${query.get('ce')}` })
    });
    router.on('/ae/be/:ce', (req, query) => {
        req.respond({ body: `/a/b/${query.get('ce')}` })
    });
    router.on('/ae/be/:cf', (req, query) => {
        req.respond({ body: `don't trigger me /a/b/${query.get('cf')}` })
    });

    router.on('/slasher/', (req) => {
        req.respond({ body: `slasher1` })
    });
    router.on('/noslasher', (req) => {
        req.respond({ body: `slasher2` })
    });
    router.on('/reversed/args/:e/:f', (req, query: Map<string, string>) => {
        let e = query.get("e");
        let f = query.get("f");
        req.respond({ body: `${e} ${f}` })
    });
    router.on("/params", (req, query: Map<string, string>, params) => {
        req.respond({
            body: `${params.get("test")} ${params.get("test2")} ${params.get(
                "bigtestquerythatsverybigandpropopablybiggerthanyouwouldthink"
            )}`,
        });
    });

    router.on("/params/level", (req, query: Map<string, string>, params) => {
        req.respond({
            body: `${params.get("test")} ${params.get("test2")} ${params.get(
                "bigtestquerythatsverybigandpropopablybiggerthanyouwouldthink"
            )}`,
        });
    });
    router.on(
        "/params-two-question",
        (req, query: Map<string, string>, params) => {
            req.respond({
                body: `${params.get("a")}`,
            });
        }
    );


    assertEquals(await (await fetch("http://localhost:8000/reversed/args/e1/f1")).text(), "e1 f1")
    assertEquals(await (await fetch("http://localhost:8000/ae/")).text(), "/a")
    assertEquals(await (await fetch("http://localhost:8000/ae/651")).text(), "/a2/651")
    assertEquals(await (await fetch("http://localhost:8000/ae/652/653")).text(), "/a3/652/653")
    assertEquals(await (await fetch("http://localhost:8000/ae/be/654")).text(), "/a/b/654")
    assertEquals(await (await fetch("http://localhost:8000/slasher")).text(), "slasher1")
    assertEquals(await (await fetch("http://localhost:8000/slasher/")).text(), "slasher1")
    assertEquals(await (await fetch("http://localhost:8000/noslasher")).text(), "slasher2")
    assertEquals(await (await fetch("http://localhost:8000/noslasher/")).text(), "slasher2")
    assertEquals(await (await fetch("http://localhost:8000/params?test=hello&test2=234&bigtestquerythatsverybigandpropopablybiggerthanyouwouldthink=c"))
        .text(), "hello 234 c"
    );
    assertEquals(await (await fetch("http://localhost:8000/params-two-question??a=2")).text(), "2");
    assertEquals(await (await fetch(`http://localhost:8000///params-two-question//??a=2`)).text(), "2");
    assertEquals(await (await fetch("http://localhost:8000/params/level?test=hello&test2=xc8)_^%^&bigtestquerythatsverybigandpropopablybiggerthanyouwouldthink=1"))
        .text(), "400 Bad Request");
    s.close();
})


