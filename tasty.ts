import { serve, ServerRequest } from "https://deno.land/std@v0.42.0/http/server.ts";
// import { tasty } from "https://github.com/crunchskills/tasty/tasty.ts";

namespace tasty {
    class Route {
        path: string
        handler: any
        path_segments: string[] = []
        constructor(path: string, handler: any) {
            this.path = path
            this.handler = handler
            if(path[0] !== '/') {
                throw `Invalid path ${path}. Paths should begin with a slash /`;
            }
            let currPathSegment = "";
            for(var i = 0; i < path.length; i++) {
                if(i > 0) {
                    let c = path[i];
                    if(c === "/") {
                        if(currPathSegment.length < 1) {
                            throw `Invalid path ${path}. Each path segment should be seperated by exactly one slash /`;
                        }
                        else {
                            this.path_segments.push(currPathSegment);
                            currPathSegment = "";
                        }
                    }
                    else {
                        currPathSegment += c;
                    }
                }
            }
            if(currPathSegment.length > 0) {
                this.path_segments.push(currPathSegment);
                currPathSegment = "";
            }
            console.log(`Added path ${path} with segments: ${JSON.stringify(this.path_segments)}`)
            console.log(`Handler: ${handler}`)
        }
        describe_handler() {
            console.log(`## HANDLER for ${this.path}: ${this.handler}`)
        }
    }
    export class Router {
        serve_instance: any;
        routes: Route[] = [];
        handle404: any
        constructor(serve_instance: any) {
            this.serve_instance = serve_instance;
            this.handle404 = this.handle404default
            this.route()
        }
        sanitizedPath(path: string): string {
            if(path === "/" || path === "") {
                return "/"
            }
            let newPath = path.toLowerCase().trim();
            // Remove all trailing slashes
            while(newPath.length > 1 && newPath[newPath.length-1] === '/') {
                newPath = newPath.substr(0, newPath.length-1)
            }
            // Remove all leading slashes
            while(newPath.length > 1 && newPath[0] === "/") {
                newPath = newPath.substr(1, newPath.length)
            }
            // Add exactly one leading slash back in
            if(newPath[0] !== "/") {
                newPath = `/${newPath}`
            }
            return newPath
        }
        async route() {
            console.log("route")
            for await (const req of s) {
                console.log('new req')
                let matched = false;
                
                let requested = new Route(req.url, null)
                // Only match against routes with the same number of segments
                let routsWithSameCountOfSegments = this.routes.filter((route) => {
                    return route.path_segments.length === requested.path_segments.length
                })
                // Further filter my routes with exact matches or potential matches from slugs
                let possibleRoutes: Route[] = []
                for(let rdx in routsWithSameCountOfSegments) {
                    let route = routsWithSameCountOfSegments[rdx];
                    let routeDisqualified = false
                    let wildcard_count = 0;
                    let first_wildcard = -1;
                    for(var segment_idx = 0; segment_idx <  route.path_segments.length; segment_idx++) {
                        let route_segment = route.path_segments[segment_idx];
                        if(route_segment[0] == ":") {
                            // This is a slug/wildcard so we can't filter it yet
                            if(wildcard_count == 0) {
                                first_wildcard = segment_idx
                            }
                            wildcard_count++
                        }
                        else {
                            if(route_segment != requested.path_segments[segment_idx]) {
                                // Non-matching route
                                routeDisqualified = true
                                break
                            }
                        }
                    }
                    if(!routeDisqualified) {
                        possibleRoutes.push(route)
                    }
                }
                // By now, possibleRoutes contains only routes with the same # of segments,
                // and either exact matches or wildcards.
                // TODO: Sort on route insert, rather than on query
                let possibleRoutesSorted = possibleRoutes.sort((a, b) => {
                    for(var i=0;i<a.path_segments.length;i++) {
                        let psa = a.path_segments[i];
                        let psb = b.path_segments[i];
                        let a_is_wild = psa[0] === ":"
                        let b_is_wild = psb[0] === ":"
                        if (a_is_wild != b_is_wild) {
                            if(a_is_wild) {
                                // b is the better choice bc it is more specific
                                return 1
                            }
                            else {
                                // a is the better choice bc it is more specific
                                return -1
                            }
                        }
                    }
                    // TheyreTheSamePicture.gif
                    return 0
                })
                console.log(`  ####  ${requested.path}  ####  `)
                console.log(JSON.stringify(possibleRoutesSorted))
                console.log(" ");console.log(" ");
                if(possibleRoutesSorted.length > 0) {
                    let selectedRoute = possibleRoutesSorted[0];
                    matched = true
                    selectedRoute.describe_handler();
                    selectedRoute.handler(req)
                }

                console.log('Done looking for slugs and matches..')
                if(!matched) {
                    // Handle 404 when no match occurs
                    console.log(`404: ${req.url}`)
                    this.handle404(req)
                }
            }
        }
        404(handler: any) {
            this.handle404 = handler
        }
        handle404default(req: ServerRequest) {
            req.respond({ body: `404 Not Found` })
        }
        on(route: string, handler: (req: ServerRequest, ...cbargs: any[]) => void)  {
            let newRoute = new Route(route, handler);
            this.routes.push(newRoute)
        }
        //AsyncIterableIterator<ServerRequest>
    }
}


const s = serve({ port: 8000 });
let router = new tasty.Router(s);
router.on('/jobs/', (req) => {
    req.respond({ body: `You loaded up a page called /jobs` })
});
router.on('/jobs/5', (req) => {
    req.respond({ body: `You loaded up a page called /jobs/5` })
});
router.on('/jobs/:id', (req, id: number) => {
    // console.log(` /jobs/:id ## CALLED BACK with ${JSON.stringify(id)}`)
    // let str = `You loaded up a page called jobs with id ${id}`;
    // req.respond({ body: str })
    req.respond({ body: `/jobs/ID${id}` })
});

router.on('/jobs/help/:page', (req, id: number, page: number) => {
    req.respond({ body: `/jobs/help/PAGE${page}` })
});
router.on('/jobs/:id/:page', (req, id: number, page: number) => {
    req.respond({ body: `/job/ID${id}/PAGE${page}` })
});

router.on('/jobs/more/4', (req) => {
    req.respond({ body: "/jobs/more/4" })
});

router.on('/jobs/more/:page', (req, page: number) => {
    req.respond({ body: `/jobs/more/ PAGE: ${page}` })
});

router.on('/jobs/more/:page/4', (req, page: number) => {
    req.respond({ body: `/jobs/more/PAGE${page}/4` })
});

router.on('/favicon.ico', (req) => {
    req.respond({ body: `` })
})