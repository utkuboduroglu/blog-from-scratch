const fs = require('fs');
const sqlite = require('better-sqlite3');

// all posts, stored as markdown entries
const postFilesDirectory = './posts';

function markdownFilesInDirectory(pathname) {
    const filename_re = /.*\.md$/;

    // fs.readdir is async!
    const result = new Promise((resolve, reject) =>
    {
        fs.readdir(pathname, (err, files) => {
            if (err) reject(err);
            // filter the files so that they are md files
            // hacky solution: just check that the filename ends in .md!
            else resolve(files);
        });
    });

    return result
        .then(files => files
            .filter(filename => filename.match(filename_re) != null))
        .catch(err => console.log(err));
}

// files table should also handle caching and serving of markdown blobs!
class FilesTable {
    constructor() {
        this.db = sqlite(':memory:');

        this.db.exec(
            'CREATE TABLE IF NOT EXISTS markdown_posts (' +
                'filename TEXT UNIQUE,' +
                'mod_date DATE NOT NULL' +
            ');'
        );

    }

    async push_directory(pathname) {
        const file_list = await markdownFilesInDirectory(pathname);
        console.log(file_list);
        file_list.forEach(filename => this.push_file(filename));
    }

    push_file(filename) {
        const insert = this.db.prepare(
            'INSERT INTO markdown_posts (filename, mod_date) VALUES (?, ?);'
        );

        const file_date = fs.statSync(filename)
            .mtime
            .toISOString();

        insert.run(filename, file_date);
    }

    dump_files_table() {
        return this.db
            .prepare('SELECT * FROM markdown_posts;')
            .all();
    }
}

module.exports = {
    FilesTable: FilesTable,
};
