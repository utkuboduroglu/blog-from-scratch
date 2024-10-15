// It's very hard to keep track of the purpose of each of these imports;
// TODO: We can solve this by compartmentalizing code into separate source files
const fs = require('fs');
const path = require('path');

const { parseMarkdown } = require('./markdown');
const ejs = require('ejs');

const express = require('express');
app = express();

const { FilesTable } = require('./post_process');
const { Config } = require('./config');

const cfg = new Config('./config.json');
const {hostname, port} = cfg.server_properties;

// the db connection works!
const ft = new FilesTable(cfg);

app.use(express.static(cfg.static_serve_path));

// Each endpoint gets its own callback function, these should all be in separate source files; 
// TODO: Handle insertion points according to what the config says...
// regarding what endpoints are exposed etc...
app.get('/', (req, res) => {
    // header data
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // const file_request = processFileRequest(req);
    // const posts = ft.retrieve_posts_data(file_request);

    // reading static files for use is a common task for all the files we're serving
    // TODO: put this functionality in its own function
    const posts = ft.retrieve_all_metadata()
        .map(p => {
            const preamble = ft.get_file_preamble(p.post_hash);
            cfg.log("preamb:", preamble);

            return {
                post_hash: p.post_hash,
                title: preamble.post_title, // ft.get_file_info(p.post_hash)["post_title"]
                specified_date: preamble.post_specified_date
            };
        });

    // try ... catch?
    // serveHomePageContent(res, cfg, posts);

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

    // const file_info = processFileRequest(req, cfg);

    if ("file_id" in req.query) {
        const info = ft.get_file_metadata(req.query["file_id"]);
        if (info == undefined) {
            res.statusCode = 400;
            res.end("bad request");
            return;
        }

        // serveBlogPostContent(res, cfg, file_info);

        // TODO: Replace this with ft.serve_file whenever possible
        // as it stands, we read through the file twice which we absolutely
        // don't need to do
        fs.readFile(info.filename, 'utf-8', async (err, data) => {
          if (err) throw err;

          const res_body = await parseMarkdown(cfg, data);
          res.end(res_body);
        });
    }

});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
})
