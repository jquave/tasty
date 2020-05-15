import { ServerRequest } from '../deps.ts';
import { Route, Handler } from './route.ts';

export class Router {
    table: Map<string, Route[]> = new Map<string, Route[]>();
    handle404: any;

    constructor() {
        this.handle404 = this.handle404default;
    }

    async route(request: ServerRequest) {
            let matched = false;
            //split the requested url on ? and remove all empty spaces resulting from several ?s
            const [ path, queryParams ] = request.url.split("?").filter((word: string) => word.length > 0)
            let requested = new Route(path);
            // Only match against routes with the same number of segments
            const routes = this.table.get(request.method) ?? [];
            let routsWithSameCountOfSegments = routes.filter((route) => {
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
            if(possibleRoutesSorted.length > 0) {
                let selectedRoute = possibleRoutesSorted[0];
                matched = true

                    if (selectedRoute.handler) {
                    if(selectedRoute.path.length === 1) {
                        selectedRoute.handler(request, new Map<string, string>(), new URLSearchParams());
                    }
                    else {
                        let argsMap: Map<string, string> = new Map();
                        let urlParams;
                        try { // exception handling for malformed URL
                            urlParams = new URLSearchParams(queryParams);
                        } catch {
                            console.log(`Bad request ${queryParams}`);
                            request.respond({ body: `400 Bad Request` });
                            return;
                        }
                        // Find the indices of the slugs
                        let routeSlugs: string[] = []
                        let slugIndices: number[] = []

                        for(var i = 0; i < selectedRoute.path_segments.length; i++) {
                            let path = selectedRoute.path_segments[i];
                            if(path[0] === ":") {
                                const sslug = path.substring(1, path.length);
                                routeSlugs.push(sslug);
                                slugIndices.push(i);
                            }
                        }
                        for(var i = 0; i < routeSlugs.length; i++) {
                            // args.push(requested.path_segments[slugIndices[i]])
                            let argKey = routeSlugs[i]
                            let argVal = requested.path_segments[slugIndices[i]]
                            console.log(`set ${argKey} to ${argVal}`)
                            argsMap.set(argKey, argVal);
                        }
                        selectedRoute.handler(request, argsMap, urlParams);
                    }
                }
            } else {
                // Handle 404 when no match occurs
                console.log(`404: ${request.url}`)
                this.handle404(request)
            }
    }
    404(handler: any) {
        this.handle404 = handler
    }
    handle404default(request: ServerRequest) {
        request.respond({ body: `404 Not Found` })
    }
    on(config: {
            method: string,
            path: string,
            handler: Handler
    }) {
        let route = new Route(config.path, config.handler);
        const method = config.method.toUpperCase();

        const routes = this.table.get(method) ?? [];
        this.table.set(method, [ ...routes, route ]);
    }
}