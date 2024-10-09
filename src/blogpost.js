// blog post abstraction which serves as an interface for anything to do with the individual blog post entries
const fs = require('fs');
const sha1 = require('sha1');
const { extractMarkdownHeader } = require('./markdown_parse');
const { Config } = require('./config');

class BlogPost {

    constructor(filename, config) {
        this.filename = filename;
        // as a hacky solution, we just give ownership of the "markdown preamble"
        // to the class, though as we process the config file, this should definitely
        // change!
        // TODO: refactor this part in accordance to the config-specified preamble schema
        this.preamble = extractMarkdownHeader(filename);
        console.log(this.preamble);
    }

    modification_date() {
        return file_date = fs.statSync(this.filename)
            .mtime
            .toISOString();
    }

    post_hash() {
        return sha1(this.filename + this.modification_date());
    }

    post_title() {
        const title = this.preamble
            .filter((k, v) => k === "title");
        if (title == null) {
            throw Error("No title in markdown file!");
        }
        return title;
    }

    // equivalently: parse the file!
    serve() {
        // For now, this is just as it is in markdown_parse.js, though we will let EJS handle the merging of preamble and body
        // TODO: Invoke this through EJS
        const data = fs.readFileSync(this.filename, 'utf-8');
        return parseMarkdownHeader(data);
    }

    get_title() {
        // we hardcoded title here, but it's possible that the config json says something otherwise...
        // TODO(?): Decide whether it is okay to hardcode 'title' as a special keyword for the markdown preamble
        return this.preamble
            .filter(pair => pair[0] === 'title');
    }
}
