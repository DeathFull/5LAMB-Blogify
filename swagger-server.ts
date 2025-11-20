import http from "http";
import fs from "fs";
import path from "path";
import {getAbsoluteFSPath} from "swagger-ui-dist";


const swaggerPath = getAbsoluteFSPath();
const swaggerYml = fs.readFileSync("./swagger.yml");

const server = http.createServer((req, res) => {
    if (req.url === "/swagger.yml") {
        res.writeHead(200, {"Content-Type": "application/json"});
        return res.end(swaggerYml);
    }

    if (req.url === "/" || req.url === "/docs") {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8" />
              <title>API Docs</title>
              <link rel="stylesheet" href="/docs/swagger-ui.css" />
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="/docs/swagger-ui-bundle.js"></script>
              <script>
                SwaggerUIBundle({
                  url: '/swagger.yml',
                  dom_id: '#swagger-ui'
                })
              </script>
            </body>
            </html>`;
        res.writeHead(200, {"Content-Type": "text/html"});
        return res.end(html);
    }

    if (req.url?.startsWith("/docs/")) {
        const file = req.url.replace("/docs/", "") || "index.html";
        const filePath = path.join(swaggerPath, file);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(file);
            const type =
                ext === ".css" ? "text/css" :
                    ext === ".js" ? "application/javascript" :
                        "text/plain";

            res.writeHead(200, {"Content-Type": type});
            return res.end(fs.readFileSync(filePath));
        }
    }

    res.writeHead(404);
    res.end("Not found");
});

server.listen(3000, () => {
    console.log("Swagger docs: http://localhost:3000");
});
