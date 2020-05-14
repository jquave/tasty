export function sanitizedPath(path: string): string {
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