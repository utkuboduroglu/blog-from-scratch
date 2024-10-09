// this file and config.json will, in tandem, determine the data specification for the desired & valid config file
const fs = require('fs');

// hardcoded required fields; does not seem like such a bad option for now 
const required_fields = [
    'server_properties',
    'public_serve_path',
    'blog_post_path',
    'global_header_includes',
    'sql_options'
];

class Config {
    constructor(filename) {
        let data = fs.readFileSync(filename, 'utf-8');
        const proto = JSON.parse(data);
        if (!required_fields.every(
            field => proto[field] !== undefined
        )) {
            // TODO: Specify which fields are missing in this error message
            throw new Error("The configuration file is missing required fields!");
        }

        Object.assign(
            this, 
            proto
        );
    }

    global_header_text() {
        const path = this.static_serve_path + "/";
        return this.global_header_includes
            .map(file => {return fs.readFileSync(path + file, 'utf-8');})
            .join('');
    }

};

module.exports = {Config: Config};
