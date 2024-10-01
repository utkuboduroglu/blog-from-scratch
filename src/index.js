/* NOTES: 
 * * Variable names are not descriptive enough/generally not indicative of their purpose
 * * A lot of the computation is done through string buffering/text manipulation instead of
 * interfacing with their proper data structures (e.g. trees for HTML)
 * */
// It's very hard to keep track of the purpose of each of these imports;
// TODO: We can solve this by compartmentalizing code into separate source files
const fs = require('fs');
const express = require('express');
const qs = require('qs');
const { DatabaseSync } = require('sqlite');
const path = require('path');
const { FilesTable } = require('./post_process');
const { Config } = require('./config');

const { parseMarkdown } = require('./markdown_parse');

app = express();

const cfg = new Config('./config.json');
const {hostname, port} = cfg.server_properties;

// TODO: This will instead be handled by the post endpoint responding with SQL queries
// hardcoded markdown file; the actual approach would be to read a specific (possibly, again hardcoded) directory and load all markdown files into a database (in memory?)
const mdFile = './posts/test_text.md';

const headerDirectory = cfg.static_serve_path;
const headerFiles = cfg.global_header_includes;

// the db connection works!
const ft = new FilesTable();
ft.push_directory(
    cfg.public_serve_path
);

function headersToString(dir, files) {
    var headerContent = "";
    for (let fi in files) {
        headerContent += fs.readFileSync(path.join(dir, files[fi]), 'utf-8');
    }

    return headerContent;
}

// This serves the purpose, but it would be difficult to extend functionality this way
// TODO: USE EJS!
function packDataToHtml(header, body) {
    /* Given header and body data, pack the contents in a form:
     * <!DOCTYPE html>
     * <head>
     * header content
     * </head>
     * <body>
     * body content
     * </body>
     * </html>
     */

    const packedString = 
    `<!DOCTYPE html>
    <head>
    ${header}
    </head>
    <body>
    ${body}
    </body>
    </html>
    `; 

    return packedString;
}

const math_block_re = /\\\[((?:(?!\\\[|\\\]).)*)\\\]/sg;
const math_inline_re = /\$\$((?:(?!\$\$).)+)\$\$/gs;

app.use(express.static(cfg.static_serve_path));

// Each endpoint gets its own callback function, these should all be in separate source files; 
// TODO: the entrypoint file (index.js for now) should only contain info
// regarding what endpoints are exposed etc...
app.get('/', (req, res) => {
    // header data
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // reading static files for use is a common task for all the files we're serving
    // TODO: put this functionality in its own function
    fs.readFile(mdFile, 'utf-8', (err, data) => {
      if (err) throw err;

        console.log(`Serving file ${mdFile}\n`);

      let res_body = parseMarkdown(data);
        // console.log(res_body);

      res.end(
          packDataToHtml(
              headersToString(headerDirectory, headerFiles),
              res_body
          )
      );
  });
})

app.get('/post', (req, res) => {
    let query = req.query;
    let message = "Hello nerd\nYou sent me: {";
    for (let queryKey in query) {
        message += `"${queryKey}": ${query[queryKey]},\n`;
    }
    message += "}\n";

    if ("file_id" in query) {
        message += JSON.stringify(

            ft.get_file_info(query["file_id"])
        );
    }

    res.send(message);
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
})