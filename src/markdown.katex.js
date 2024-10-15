/* TODO: instead of simply replacing matches for inline/block math,
 * processKaTeX should take a callback in place of katex.renderToString
 * to serve more of an interactive object in its place */
const math_block_re = /\\\[((?:(?!\\\[|\\\]).)*)\\\]/s;
const math_inline_re = /\$\$((?:(?!\$\$).)+)\$\$/s;
const katex = require('katex');

module.exports = {
    // we match inline & block LaTeX math environments, capture the contents,
    // pass them through the KaTeX syntax and replace the captures with the new
    // KaTeX tags! all before we process the markdown
    markdownProcessKaTeX: (markdown_body) => {
        const replacement = (match, mode) => katex.renderToString(match,
            {
                displayMode: mode,
                strict: false,
                throwOnError: true // TODO: remove this after debugging!!!
            }
        );

        let block_match = markdown_body.match(math_block_re);
        while (block_match != null) {
            markdown_body = markdown_body.replace(math_block_re, replacement(block_match[1], true));
            block_match = markdown_body.match(math_block_re);
        }

        let inline_match = markdown_body.match(math_inline_re);
        while (inline_match != null) {
            markdown_body = markdown_body.replace(math_inline_re, replacement(inline_match[1], false));
            inline_match = markdown_body.match(math_inline_re);
        }

        return markdown_body;
    }
}
