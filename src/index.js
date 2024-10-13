/* NOTES: 
 * * Variable names are not descriptive enough/generally not indicative of their purpose
 * * A lot of the computation is done through string buffering/text manipulation instead of
 * interfacing with their proper data structures (e.g. trees for HTML)
 * */
// It's very hard to keep track of the purpose of each of these imports;
// TODO: We can solve this by compartmentalizing code into separate source files
const fs = require('fs');
const express = require('express');
const path = require('path'); // TODO: Use this for paths please!
const { FilesTable } = require('./post_process');
const { Config } = require('./config');
const ejs = require('ejs');
const { parseMarkdown } = require('./markdown_parse');

app = express();

const cfg = new Config('./config.json');
const {hostname, port} = cfg.server_properties;

// the db connection works!
const ft = new FilesTable(cfg);

app.use(express.static(cfg.static_serve_path));

// Each endpoint gets its own callback function, these should all be in separate source files; 
// TODO: the entrypoint file (index.js for now) should only contain info
// TODO: Handle insertion points according to what the config says...
// regarding what endpoints are exposed etc...
app.get('/', (req, res) => {
    // header data
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // reading static files for use is a common task for all the files we're serving
    // TODO: put this functionality in its own function
    const posts = ft.retrieve_all_metadata()
        .map(p => {
            const preamble = ft.get_file_preamble(p.post_hash);
            console.log("preamb:", preamble);

            return {
                post_hash: p.post_hash,
                title: preamble.post_title, // ft.get_file_info(p.post_hash)["post_title"]
                specified_date: preamble.post_specified_date
            };
        });

    // TODO: serving should definitely be its own thing...
    ejs.renderFile(
        path.join(cfg.public_serve_path, "home.ejs"),
        {
            static_header: {
                text: cfg.global_header_text()
            },
            posts: posts
        },
        null,
        (err, str) => {
            res.end(str);
        }
    );

})

app.get('/post', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if ("file_id" in req.query) {
        const info = ft.get_file_info(req.query["file_id"]);
        if (info == undefined) {
            res.statusCode = 400;
            res.end("bad request");
            return;
        }

        // TODO: we can do this async or through FT with BlogPost?
        fs.readFile(`${cfg.blog_post_path}/${info.filename}`, 'utf-8', async (err, data) => {
          if (err) throw err;

          const res_body = await parseMarkdown(cfg, data);

          res.end(
                  res_body
          );
        });
    }

});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
})
