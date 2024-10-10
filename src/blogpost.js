// blog post abstraction which serves as an interface for anything to do with the individual blog post entries
const fs = require('fs');
const sha1 = require('sha1');
const { separateMarkdownPreamble, processMarkdown, parseMarkdownPreamble } = require('./markdown_parse');
const { Config } = require('./config');

class BlogPost {

    constructor(filename, config) {
        this.filename = filename;
        // as a hacky solution, we just give ownership of the "markdown preamble"
        // to the class, though as we process the config file, this should definitely
        // change!
        // TODO: refactor this part in accordance to the config-specified preamble schema
        const filedata = fs.readFileSync(filename, 'utf-8');
        const separate = processMarkdown(this.cfg,filedata);
        this.preamble = separate.tokens;
        this.file_body = separate.body;
        console.log(this.preamble);
    }

    modification_date() {
        return file_date = fs.statSync(this.filename)
            .mtime
            .toISOString();
    }

    serve_final_body() {
        return parseMarkdownPreamble(this.cfg, {
            tokens: this.preamble,
            body: this.body
        });
    }

    post_hash() {
        return sha1(this.filename + this.modification_date());
    }

    post_field(field) {
        const result = this.preamble
            .filter((k, v) => k === field);
        if (title == null) {
            throw Error("Specified field does not exist!");
        }
        return result;
    }

    // equivalently: parse the file!
    serve() {
        // For now, this is just as it is in markdown_parse.js, though we will let EJS handle the merging of preamble and body
        // TODO: Invoke this through EJS
        const data = fs.readFileSync(this.filename, 'utf-8');
        return parseMarkdownHeader(data);
    }
}
