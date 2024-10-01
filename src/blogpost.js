// blog post abstraction which serves as an interface for anything to do with the individual blog post entries
const fs = require('fs');
const sha1 = require('sha1');
const { extractMarkdownHeader } = require('./markdown_parse');

class BlogPost {

    constructor(filename) {
        this.filename = filename;
        // as a hacky solution, we just give ownership of the "markdown preamble"
        // to the class, though as we process the config file, this should definitely
        // change!
        // TODO: refactor this part in accordance to the config-specified preamble schema
        this.preamble = extractMarkdownHeader(filename);
    }

    modification_date() {
        return file_date = fs.statSync(this.filename)
            .mtime
            .toISOString();
    }

    // equivalently: parse the file!
    serve() {}

    post_hash() {
        return sha1(this.filename + this.modification_date());
    }

    get_title() {}
}
