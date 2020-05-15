import { ServerRequest } from '../deps.ts';

export type Handler = (
  req: ServerRequest,
  query: Map<string, string>,
  params: URLSearchParams
) => void;

export class Route {
  path: string;
  handler?: Handler;
  path_segments: string[] = []
  constructor(path: string, handler?: Handler) {
      this.path = path
      this.handler = handler

      if(!path.startsWith('/')) {
          throw `Invalid path ${path}. Paths should begin with a slash /`;
      }

      let currentPathSegment = "";
      for(var i = 0; i < path.length; i++) {
              let c = path[i];
              if(c === "/") {
                  // collapse all slashes into the last one used by checking if a slash is the next on
                  if(path[i + 1] && path[i + 1] !== "/") {
                      this.path_segments.push(currentPathSegment);
                      currentPathSegment = "";                    
                  }
              }
              else {
                  currentPathSegment += c;
              }
      }
      if(currentPathSegment.length > 0) {
          this.path_segments.push(currentPathSegment);
          currentPathSegment = "";
      }
  }
}
