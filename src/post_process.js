const fs = require('fs');
const sqlite = require('better-sqlite3');
const { PostLoader } = require('./postloader');
const path = require('path');

function markdownFilesInDirectory(pathname) {
    const filename_re = /.*\.md$/;

    const result = fs.readdirSync(pathname, 'utf-8');
    return result
        .filter(filename => filename.match(filename_re) != null);
}

class DatabaseQuery {

}

// this may as well just be [PostTable]...
class PostDatabase {
    // tables : &[PostTable]
    // retrieve_table : (&self, table_name: &str) -> &PostTable
    // evaluate_query : (&mut self, query: DatabaseQuery) -> Result<Data, Err>
}

class PostTable {
    // schema : TableSchema
    // get_entry : (&self, hash: &str) -> Result<PostEntry, Err> (what is this type?)
    // get_all : (&self, condition: &str) -> Result<Vec<PostEntry>, Err> (what is this type?)

    // push_entry : (&mut self, &TableConfig, &PostFile) -> Result<(), Err>
    push_entry(table_config, file) {
        // schema is a "lambda" that maps a file object to the fields
        // the table wants specifically; for example:
        // if this instance of PostTable keeps track of file metadata,
        // it maps file to an object of the sort {filename, modification_date}
        // if it keeps track of preamble, it sends {title, specified_date, tags, category, ...}
        const parameters = this.schema(file);
        const defined_fields = table_config.fields
            .filter(field => parameters[field.key] !== undefined);

        const required_fields = table_config.fields
            .filter(field => field.required === true);
        const required_fields_satisfied = required_fields
            .every(f => defined_fields.contains(f));

        if (!required_fields_satisfied) {
            throw Error({
                message: "File does not contain required fields!",
                unsatisfied_fields: required_fields
                    .filter(f => !defined_fields.contains(f))
            });
        }

        let data = {};
        defined_fields.forEach(field => {
            data[field.value] = parameters[field.key];
        });

        // this call either throws or returns a null result, which we don't
        // care about
        const _ = this.parent.evaluate_query(
            new DatabaseQuery({
                type: "insert",
                table_name: table_config.name,
                fields: defined_fields.map(f => f.value)
            }),
            data
        );
    }
}

// files table should also handle caching and serving of markdown blobs!
class FilesTable {
    constructor(config) {
        this.db = sqlite(':memory:');
        this.cfg = config; // we're carrying the config, but why?

        config.sql_options.tables.forEach(table_info => {
            FilesTable.create_table(table_info, this.db);
        });

        this.push_directory(config.blog_post_path);

    }

    // We assume that the table_info provided here is
    // consistent with the structure in the config.json file
    static create_table(table_info, db) {
        let query_fields = [];
        table_info.table_schema.forEach(field => {
            query_fields.push(`${field.title} ${field.type}`);
        });

        // TODO: load this into json as well? 
        const query = `CREATE TABLE IF NOT EXISTS ${table_info.table_name} (${query_fields.join(',')});`;
        db.exec(query);
    }

    push_directory(pathname) {
        const file_list = markdownFilesInDirectory(pathname); // this await is probably screwing things for us!
        console.log(file_list);
        file_list.forEach(filename => {
            this.push_file_metadata(filename);
            this.push_file_preamble(filename);
            // this.push_file_blob(filename);
        });
        // concatenating paths like this is probably VERY unsafe! TODO
    }

    // TODO: ambiguous naming! this is only for metadata!
    // TODO: Also, all push methods can be generalized to a single push method,
    // and a schema -> datafields method. 
    push_file_metadata(filename) {
        const insert = this.db.prepare(
            this.cfg.sql_options.access_queries.metadata_insert
        );

        const post = new PostLoader(
            path.join(this.cfg.blog_post_path, filename)
        );
        // the path here probably shouldn't be JUST blog_post_path! TODO(?)
        // Although, this method is specifically ONLY for markdown files, so... fine for now?

        const mod_date = post.modification_date();
        const file_id = post.hash();
        console.log(file_id);

        insert.run({
            id: file_id,
            filename: filename,
            mod_date: mod_date
        });
    }

    // I'm just generally unhappy with how I handled parsing the preamble/body
    // TODO: Do this the right way!!!! DISGUSTING
    push_file_preamble(filename) {
        const post = new PostLoader(
            path.join(this.cfg.blog_post_path, filename)
        );

        const file_date = post.modification_date();

        const file_id = post.hash();

        const fp = fs.readFileSync(
            path.join(this.cfg.blog_post_path, filename),
            'utf-8'
        );
        // this will lead to multiple calculations, this is why BlogPost should own the file!!!
        // TODO: BlogPost should own file resources!
        const preamble = post.preamble;

        // TODO: match these based on what's specified in the config
        console.log("What is this", preamble);
        const title = preamble.filter(p => p[0] == "title")[0][1];
        // TODO: date will always be specified, fix
        let specified_date = preamble.filter(p => p[0] == "date")[0];
        if (specified_date == undefined) {
            specified_date = new Date('01 January 1970 12:00 UTC').toISOString(); 
        } else {
            specified_date = specified_date[1];
        }
        const hash = file_id;

        // We implemented this; please use that instead TODO
        // idk how to do this to be honest with you
        const insert = this.db.prepare(
            `INSERT INTO post_preamble (post_hash, post_title, post_specified_date) VALUES (@hash, @title, @specified_date);`
        );

        insert.run({
            title: title,
            hash: hash,
            specified_date: specified_date
        });
    }

    retrieve_all_metadata() {
        return this.db
            .prepare(
                this.cfg.sql_options.access_queries.metadata_retrieve
            )
            .all();
    }

    // TODO: this is ambiguous! It only retrieves file metadata info!
    get_file_info(file_id) {
        const fetch = this.db.prepare(
            this.cfg.sql_options.access_queries.retrieve_file_info
        );
        return fetch.get(file_id);
    }

    // TODO: do not do this hardcoded!!!! Ideally, also let BlogPost do this
    get_file_preamble(file_id) {
        const fetch = this.db.prepare(
            "SELECT * FROM post_preamble WHERE post_hash == ?"
        );

        return fetch.get(file_id);
    }
}

class PostFile {
    constructor(ft, hash) {
        this.hash = hash;
        this.ft = ft;
    }

    get_content() {}
    get_filename() {}
    get_modification_date() {}

    // should be guaranteed to never throw on required fields
    get_field(field) {}
}

module.exports = {
    FilesTable: FilesTable,
};
