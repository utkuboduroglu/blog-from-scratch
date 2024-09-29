const marked = require('marked');
const footnote_md_re = /\[\^(\d+)\](\:?)/g;
const HTMLparser = require('node-html-parser');
const { markdownProcessKaTeX } = require('./katex_search_and_replace');


// this acts more like a dictionary (or map? idk what it's called) that takes
// function pointers to export with the given names
module.exports = {
    // data is a bad naming convention;
    parseMarkdown: function (data) {
        let parsed_katex = markdownProcessKaTeX(data);
        let parsed_head = parseMarkdownHeader(parsed_katex);
        
        // specifying file contents to parse() works!
        let res_body = marked.parse(parsed_head);

        return res_body;
    }

}

class HTMLNode {
  constructor(type, data=null, _class=null, id=null) {
    this.type = type,
    this.data = data,
    this.class = _class,
    this.id = id
  }
  
  html_string() {
    let opening_string = "<" + this.type;
    let closing_string = "</" + this.type + ">";
    if (this.class != null) {
      opening_string += ` class="${this.class}"`;
    }
    if (this.id != null) {
      opening_string += ` id="${this.id}"`;
    }
    opening_string += ">";
    
    // the tag type may not admit a closing string but for now we don't care
    return opening_string + this.data + closing_string;
  }
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

function parseMarkdownHeader(rawdata) {
    const re = /---(.*)---/s;
    let items = rawdata.match(re)[1];
    let tokens = items
      .split("\n")
      .filter(item => item !== '')
      .map(tok => tok.split(':'));

    let resultStringHTML = "";
    for (let i in tokens) {
        let token_pair = tokens[i];

        if (!token_pair[0] == '') {
            resultStringHTML += headerPairToHTMLTag(token_pair)
                .html_string();
        }
    }

    return resultStringHTML + rawdata.replace(re, "");
}
