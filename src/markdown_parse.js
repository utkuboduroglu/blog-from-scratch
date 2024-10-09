const marked = require('marked'); // any reason we're not using commonmark?
const footnote_md_re = /\[\^(\d+)\](\:?)/g;
const HTMLparser = require('node-html-parser');
const { markdownProcessKaTeX } = require('./katex_search_and_replace');
const { HTMLNode } = require('./html_node');
const { markdownInsertFooter } = require('./footer_search_and_replace');
const ejs = require('ejs');


// this acts more like a dictionary (or map? idk what it's called) that takes
// function pointers to export with the given names
module.exports = {
    // data is a bad naming convention;
    parseMarkdown: function (config, data) {
        let footer_md = markdownInsertFooter(data);
        let parsed_katex = markdownProcessKaTeX(footer_md);
        let parsed = parseMarkdownHeader(config, parsed_katex);
        

        return parsed;
    },

    extractMarkdownHeader: extractMarkdownHeader
}


function headerKeyTypes(key) {
    const keymap = {
        "title": "h1",
        "default": "span"
    };

    if (key in keymap) {
        return keymap[key];
    } else {
        return keymap["default"];
    }
}

// this anticipated a proper data structure, not a pair of strings in that sense 
function headerPairToHTMLTag(headerPair) {
    let key = headerPair[0];
    let value = headerPair[1];
    let keyType = headerKeyTypes(key);

    return new HTMLNode(keyType, value, key);
}

function extractMarkdownHeader(rawdata) {
    const re = /---(.*)---/s;
    let match = rawdata.match(re);
    if (match == null) {
        return null;
    }
    let items = match[1];
    let tokens = items
      .split("\n")
      .filter(item => item !== '')
      .map(tok => tok.split(':'));

    return tokens;
}

async function parseMarkdownHeader(config, rawdata) {
    const re = /---(.*)---/s;
    const extract = extractMarkdownHeader(rawdata);

    if (extract == null) {
        throw Error("Markdown file cannot contain empty preamble!");
    }

    const preamble = extract
        .map(p => {
            const label = p[0];
            const value = p[1];
            const tag_type = headerKeyTypes(label);
            return {
                label: label,
                value: value,
                tag_type: tag_type
            };
        });
    const body_text = marked.parse(rawdata.replace(re, ""));
    const static_header = { text: config.global_header_text() };

    // hardcoded path /post, though that is where we serve the markdown posts...
    const template_filename = config.endpoints.filter(ob => ob.URI == "/post")[0].resource;
    const path = config.public_serve_path;

    const promise = new Promise((resolve, reject) => {
            ejs.renderFile(
            `${path}/${template_filename}`,
            {
                static_header: static_header,
                preamble: preamble,
                body_text: body_text
            },
            null,
            (err, str) => {
                if (err) {
                    reject(err);
                }

                resolve(str);
            }
        );
    });

    return promise;
}
