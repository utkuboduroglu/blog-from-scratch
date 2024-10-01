module.exports = {
    HTMLNode: class HTMLNode {
      constructor(type, data="", _class=null, id=null, parent=null) {
        this.type = type,
        this.data = data,
        this.class = _class,
        this.id = id,
        this.href = null,
        this.children = [];

          if (parent != null) {
              parent.children.push(this);
          }
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
        if (this.href != null) {
            opening_string += ` href="${this.href}"`;
        }
        opening_string += ">";

        let children_string = "";
        if (this.children.length !== 0) {
            this.children.map(
                child => {children_string += 
                        child.html_string();
                }
            );
        }
        
        // the tag type may not admit a closing string but for now we don't care
        return opening_string + this.data + children_string + closing_string;
      }
    }
}
