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
    // constructor(schema) {}
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
            // NOTE: is this a sensible way of creating errors?
            const err = new Error("File does not contain required fields!");
            Object.assign(err,
            {
                unsatisfied_fields: required_fields
                    .filter(f => !defined_fields.contains(f))
            });
            throw err;
        }

        let data = {};
        defined_fields.forEach(field => {
            data[field.value] = parameters[field.key];
        });

        // this call either throws or returns a null result, which we don't
        // care about
        const _ = this.parent.evaluate_query(
            // we just pass the prototype; ideally, I would like
            // this to be the exact same thing as DatabaseQuery,
            // but js is not really happy about that
            {
                type: "insert",
                table_name: table_config.name,
                fields: defined_fields.map(f => f.value)
            },
            data
        );
    }
}

// files table should also handle caching and serving of markdown blobs!
// inherit PostTable? (and also rename both?)
class FilesTable {
    constructor(config) {
        this.db = sqlite(':memory:');
        this.cfg = config; // we're carrying the config, but why?

        config.sql_options.tables.forEach(table => {
            FilesTable.create_table(table, this.db);
        });

        this.push_directory(config.blog_post_path);
        console.log("Available files: ", this.retrieve_all_metadata());

    }

    // We assume that the table_info provided here is
    // consistent with the structure in the config.json file
    static create_table(table_info, db) {
        let query_fields = [];
        table_info.table_schema.forEach(field => {
            // we casually exploit the query syntax of SQL here
            query_fields.push(`${field.title} ${field.type}`);
        });

        // TODO: either inherit PostTable of just port functionality to that
        // class to instead use the query method we created there
        // although... it works in a hacky way; this could be low priority
        const query = `CREATE TABLE IF NOT EXISTS ${table_info.table_name} (${query_fields.join(',')});`;
        db.exec(query);
    }

    push_directory(pathname) {
        const file_list = markdownFilesInDirectory(pathname); 

        file_list.forEach(filename => {
            const post = new PostLoader(
                path.join(this.cfg.blog_post_path, filename)
            );

            this.push_file(post);
        });
    }

    push_file(post) {
        try {
            // TODO: do this according to what the config.json says
            this.push_file_preamble(post);
            this.push_file_metadata(post);
            // this.push_file_blob(filename);
        } catch(err) {
            console.log(`[${post.filename}]: ${err}`);
            if (err.missingField !== undefined) {
                console.log(`${post.filename} is missing field ${err.missingField}, not including in list\n`);
            } else {
                throw err;
            }
            return;
        }
    }

    // TODO: Also, all push methods can be generalized to a single push method,
    // and a schema -> datafields method. 
    push_file_metadata(post) {
        const table_query = this.db.prepare(
            this.cfg.sql_options.access_queries.metadata_insert
        );

        const mod_date = post.modification_date();
        const file_id = post.hash();

        const query_data = {
            id: file_id,
            filename: post.filename,
            mod_date: mod_date
        };

        table_query.run(query_data);
    }

    // TODO: This is fine for now (as it is a required method), but
    // port it to PostTable.push_entry whenever ready
    push_file_preamble(post) {
        const preamble = post.preamble;

        // TODO: "title" and "date" should instead be passed according to
        // what's specified in the config
        const title = post.field("title");
        const specified_date = new Date(post.field("date")).toISOString();
        const hash = post.hash();

        const table_query = this.db.prepare(
            `INSERT INTO post_preamble (post_hash, post_title, post_specified_date) VALUES (@hash, @title, @specified_date);`
        );

        const query_data = {
            hash: hash,
            title: title,
            specified_date: specified_date
        };

        table_query.run(query_data);
    }

    retrieve_all_metadata(sort=true) {
        const result = this.db
            .prepare(
                this.cfg.sql_options.access_queries.metadata_retrieve
            )
            .all();

        if (sort) {
            result.sort((a, b) => {
                // these probably shouldn't be called modification date and
                // should depend on what config.json says
                // FIX: this does not sort by date, it seems alphabetical
                const left = new Date(a.modification_date);
                const right = new Date(b.modification_date);

                return right - left;
            });
        }

        return result;
    }

    get_file_metadata(file_id) {
        const db_query = this.db.prepare(
            this.cfg.sql_options.access_queries.retrieve_file_info
        );
        return db_query.get(file_id);
    }

    // TODO: do not do this hardcoded!!!! Ideally, also let PostTable do this
    get_file_preamble(file_id) {
        const fetch = this.db.prepare(
            "SELECT * FROM post_preamble WHERE post_hash == ?"
        );

        return fetch.get(file_id);
    }
}


module.exports = {
    FilesTable: FilesTable,
};
