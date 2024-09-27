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

const marked = require('marked');
const footnote_md_re = /\[\^(\d+)\](\:?)/g;

app = express();

// TODO: Hardcoded values, put these in a config file!
const hostname = '127.0.0.1';
const port = 8888;

// hardcoded markdown file; the actual approach would be to read a specific (possibly, again hardcoded) directory and load all markdown files into a database (in memory?)
const mdFile = './test_text.md';

const headerDirectory = './headers';
const headerFiles = ['deps.html'];

function headersToString(dir, files) {
    var headerContent = "";
    for (let fi in files) {
        headerContent += fs.readFileSync(path.join(dir, files[fi]), 'utf-8');
    }

    return headerContent;
}

// This serves the purpose, but it would be difficult to extend functionality this way
// TODO: Use an HTML parser to create a tree structure instead!
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

function parseMarkdownHeader(rawdata) {
    const re = /---(.*)---/s;
    let items = rawdata.match(re)[1];
    let tokens = items.split("\n");

    let resultStringHTML = "";
    for (let i in tokens) {
        let line = tokens[i];
        const delim_re = /\:/;
        let token_pair = line.replace(delim_re, "").split(' ');

        if (!token_pair[0] == '') {
            // This should be a special method as well (for the sake of extendability)
            resultStringHTML += `<h1 class="${token_pair[0]}">${token_pair[1]}</h1>\n`;
        }
    }

    return resultStringHTML + rawdata.replace(re, "");
}

// data is a bad naming convention;
function parseMarkdown(data) {
    let parsed_head = parseMarkdownHeader(data);
    
    // specifying file contents to parse() works!
    let res_body = marked.parse(parsed_head);

    return res_body;
}

const math_block_re = /\\\[((?:(?!\\\[|\\\]).)*)\\\]/sg;
const math_inline_re = /\$\$((?:(?!\$\$).)+)\$\$/gs;

app.use(express.static('./public'));

// Each endpoint gets its own callback function, these should all be in separate source files; 
// TODO: the entrypoint file (index.js for now) should only contain info
// regarding what endpoints are exposed etc...
app.get('/', (req, res) => {
    // header data
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    // reading static files for use is a common task for all the files we're serving
    // TODO: put this functionality in its own function
    fs.readFile(mdFile, 'utf-8', (err, data) => {
      if (err) throw err;

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
    message += "}";
    res.send(message);
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
})
