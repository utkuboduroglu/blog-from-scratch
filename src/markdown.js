const marked = require('marked'); // any reason we're not using commonmark?
const { markdownProcessKaTeX } = require('./markdown.katex');
const { markdownInsertFooter } = require('./markdown.footer');
const ejs = require('ejs');
const path = require('path'); 


// this acts more like a dictionary (or map? idk what it's called) that takes
// function pointers to export with the given names
module.exports = {
    // data is a bad naming convention;
    parseMarkdown: function (config, data) {
        const separate = processMarkdown(config, data);
        const parsed = parseMarkdownPreamble(config, separate);

        return parsed;
    },

    // TODO: better naming
    processMarkdown: processMarkdown,

    separateMarkdownPreamble: separateMarkdownPreamble,
    parseMarkdownPreamble: parseMarkdownPreamble
}

// TODO: this function should be obsoleted! markdown can only be get by file
// ownership (the only call to this function is by postloader ownership, but still)
function processMarkdown (config, data) {
        const footer_md = markdownInsertFooter(data);
        console.log("\tProcessed footers");

        const parsed_katex = markdownProcessKaTeX(footer_md);
        console.log("\tProcessed KaTeX");

        const separate = separateMarkdownPreamble(parsed_katex);

        // TODO: find a library like pino to handle this stuff
        console.log("[WARNING] processMarkdown called!")
        return separate;
}


function headerKeyTypes(key) {
    // hardcoded matching; should this be sent to the config?
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

function separateMarkdownPreamble(rawdata) {
    const re = /---(.*)---/s;
    let match = rawdata.match(re);
    if (match == null) {
        return null;
    }
    let items = match[1];
    let tokens = items
      .split("\n")
      .filter(item => item !== '')
    // calling split with that specific regex pattern allows us to
    // only split at the first :, which is useful for specifying dates
      .map(tok => tok.split(/:(.*)/s));

    const body = rawdata.replace(re, '');

    return {
        tokens: tokens,
        body: body
    };
}

// also, this should be called parseMarkdown
async function parseMarkdownPreamble(config, separate) {
    const tokens = separate.tokens;
    const body = separate.body;

    const preamble = tokens
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

    const body_text = marked.parse(body);
    const static_header = { text: config.global_header_text() };
    const data = {
        static_header: static_header,
        preamble: preamble,
        body_text: body_text
    };

    // hardcoded path /post, though that is where we serve the markdown posts...
    const template_filename = config.endpoints.filter(ob => ob.URI == "/post")[0].resource;
    const serve_path = config.public_serve_path;

    const promise = new Promise((resolve, reject) => {
            ejs.renderFile(
            path.join(serve_path, template_filename),
            data,
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
