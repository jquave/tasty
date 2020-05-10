import { ServerRequest, Server } from "https://deno.land/std@v0.42.0/http/server.ts";
import { sanitizedPath } from './path_helpers.ts'

export class Route {
    path: string
    handler: any
    path_segments: string[] = []
    constructor(path: string, handler: any) {
        this.path = path
        this.handler = handler
        if (path[0] !== '/') {
            throw `Invalid path ${path}. Paths should begin with a slash /`;
        }
        let currPathSegment = "";
        for (var i = 0; i < path.length; i++) {
            if (i > 0) {
                let c = path[i];
                if (c === "/") {
                    if (currPathSegment.length < 1) {
                        // checks if this route was made by server or during a request loop
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
        if (currPathSegment.length > 0) {
            this.path_segments.push(currPathSegment);
            currPathSegment = "";
        }
    }
}
export class Router {
    serve_instance: any;
    routes: Route[] = [];
    handle404: any
    constructor(serve_instance: Server) {
        this.serve_instance = serve_instance;
        this.handle404 = this.handle404default
        this.route()
    }
    async route() {
        console.log("🍦 tasty! 🍦")
        console.log("Serving up some tasty routes")
        for await (const req of this.serve_instance) {
            let matched = false;
            //split the requested url on ? and remove all empty spaces resulting from several ?s
            const request = req.url.split("?").filter((word: string) => word.length > 0)
            let requested = new Route(request[0], null)
            // Only match against routes with the same number of segments
            let routsWithSameCountOfSegments = this.routes.filter((route) => {
                return route.path_segments.length === requested.path_segments.length
            })
            // Further filter my routes with exact matches or potential matches from slugs
            let possibleRoutes: Route[] = []
            for (let rdx in routsWithSameCountOfSegments) {
                let route = routsWithSameCountOfSegments[rdx];
                let routeDisqualified = false
                let wildcard_count = 0;
                let first_wildcard = -1;
                for (var segment_idx = 0; segment_idx < route.path_segments.length; segment_idx++) {
                    let route_segment = route.path_segments[segment_idx];
                    if (route_segment[0] == ":") {
                        // This is a slug/wildcard so we can't filter it yet
                        if (wildcard_count == 0) {
                            first_wildcard = segment_idx
                        }
                        wildcard_count++
                    }
                    else {
                        if (route_segment != requested.path_segments[segment_idx]) {
                            // Non-matching route
                            routeDisqualified = true
                            break
                        }
                    }
                }
                if (!routeDisqualified) {
                    possibleRoutes.push(route)
                }
            }
            // By now, possibleRoutes contains only routes with the same # of segments,
            // and either exact matches or wildcards.
            // TODO: Sort on route insert, rather than on query
            let possibleRoutesSorted = possibleRoutes.sort((a, b) => {
                for (var i = 0; i < a.path_segments.length; i++) {
                    let psa = a.path_segments[i];
                    let psb = b.path_segments[i];
                    let a_is_wild = psa[0] === ":"
                    let b_is_wild = psb[0] === ":"
                    if (a_is_wild != b_is_wild) {
                        if (a_is_wild) {
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
            if (possibleRoutesSorted.length > 0) {
                let selectedRoute = possibleRoutesSorted[0];
                matched = true
                // selectedRoute.describe_handler();

                // So, this is actually the number of args in the callback, but if there's a mismatch from the params in the URL, then they just need to fix that at their call site
                let numParams = selectedRoute.handler.length;
                if (numParams == 1) {
                    selectedRoute.handler(req);
                }
                else {
                    let argsMap: Map<string, string> = new Map();
                    let urlParams;
                    try {
                        urlParams = new URLSearchParams(request[1]);
                    } catch {
                        console.log(`Bad request ${request[1]}`);
                        req.respond({ body: `400 Bad Request` });
                        continue;
                    }
                    // let args: any[] = []
                    // Find the indices of the slugs
                    let routeSlugs: string[] = []
                    let slugIndices: number[] = []
                    for (var i = 0; i < selectedRoute.path_segments.length; i++) {
                        let path = selectedRoute.path_segments[i];
                        if (path[0] === ":") {
                            const sslug = path.substring(1, path.length);
                            routeSlugs.push(sslug);
                            slugIndices.push(i);
                        }
                    }
                    for (var i = 0; i <= numParams; i++) {
                        // args.push(requested.path_segments[slugIndices[i]])
                        let argKey = routeSlugs[i]
                        let argVal = requested.path_segments[slugIndices[i]]
                        console.log(`set ${argKey} to ${argVal}`)
                        argsMap.set(argKey, argVal);
                    }
                    selectedRoute.handler(req, argsMap, urlParams);
                }
            }
            if (!matched) {
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
        req.respond({ body: `404 Not Found`, status: 404 })
    }
    on(route: string,
        handler: (
            req: ServerRequest,
            query: Map<string, string>,
            params: URLSearchParams
        ) => void) {
        let newRoute = new Route(route, handler);
        this.routes.push(newRoute)
    }
    //AsyncIterableIterator<ServerRequest>
}