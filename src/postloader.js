// blog post abstraction which serves as an interface for anything to do with the individual blog post entries
const fs = require('fs');
const sha1 = require('sha1');
const { separateMarkdownPreamble, processMarkdown, parseMarkdownPreamble } = require('./markdown');
const { Config } = require('./config');

class PostLoader {

    constructor(filename, config) {
        this.filename = filename;
        this.cfg = config;

        // TODO: refactor this part in accordance to the config-specified
        // preamble schema NOTE: Can we do all of this async? i.e. is it
        // possible to still call processMarkdown with an async function?
        const filedata = fs.readFileSync(filename, 'utf-8');

        console.log("Processing markdown for:", filename);
        const separate = processMarkdown(this.cfg, filedata);

        this.preamble = separate.tokens;
        this.file_body = separate.body;
        console.log(this.preamble);
    }

    modification_date() {
        return fs.statSync(this.filename)
            .mtime
            .toISOString();
    }

    serve() {
        return parseMarkdownPreamble(this.cfg, {
            tokens: this.preamble,
            body: this.body
        });
    }

    hash() {
        return sha1(this.filename + this.modification_date());
    }

    field(field) {
        const result = this.preamble
            .filter(pair => pair[0] == field);

        if (result == null || result.length == 0) { 
            const err = new Error("Missing field!");
            err.missingField = field;
            throw err;
        }

        return result[result.length - 1][1];
    }
}

module.exports = {
    PostLoader: PostLoader
};
