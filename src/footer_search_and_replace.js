/* 
 * TODO: FOR THE LOVE OF GOD LET'S JUST DO THIS THROUGH EJS
 * */
const footer_re = /\[\^(\d+)\](:)?/m;
const { HTMLNode } = require('./html_node');

const replacement = (match, is_bottom) => {
    // we basically want <a href="#d-other" id="d-this">[d]</a> in every case
    // If it is at the bottom, slap a ':' at the bottom
    // If it is not at the bottom, wrap it around a <sup> environment
    const position = is_bottom ? "bottom" : "top";
    const link     = is_bottom ? "top" : "bottom";
    let node = new HTMLNode("a", `[${match}]`, null, `${match}-${position}`);
    node.href = `#${match}-${link}`;

    if (is_bottom) {
        return node.html_string() + ":";
    } else {
        let root = new HTMLNode("sup");
        root.children.push(node);
        return root.html_string();
    }
};

function markdownInsertFooter(markdown_body) {
    let matches = markdown_body.match(footer_re);

    while (matches !== null) {
        let match = matches[1];
        let is_bottom = matches[2] !== undefined;

        markdown_body = markdown_body.replace(footer_re, replacement(match, is_bottom));
        matches = markdown_body.match(footer_re);
    }

    return markdown_body;
}

module.exports = {
    markdownInsertFooter: markdownInsertFooter
};
