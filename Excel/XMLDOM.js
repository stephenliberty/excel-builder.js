define(['underscore'], function (_) {
    
    var XMLDOM = function (ns, rootNodeName, documentType) {
        this.documentElement = this.createElement(rootNodeName);
        this.documentElement.setAttribute('xmlns', ns);
    };
    
    _.extend(XMLDOM.prototype, {
        createElement: function (name) {
            return new XMLDOM.XMLNode({
                nodeName: name
            });
        },
        createTextNode: function (text) {
            return new XMLDOM.TextNode(text);
        },
        toString: function () {
            return this.documentElement.toString();
        }
    });
    
    XMLDOM.Node = function () {};
    XMLDOM.Node.Create = function (config) {
        switch(config.type) {
            case "XML":
                return new XMLDOM.XMLNode(config);
                break;
            case "TEXT":
                return new XMLDOM.TextNode(config.nodeValue);
                break;
        }
    }
    
    XMLDOM.TextNode = function (text) {
        this.nodeValue = text;
    };
     _.extend(XMLDOM.TextNode.prototype, {
         toJSON: function () {
             return {
                 nodeValue: this.nodeValue,
                 type: 'TEXT'
             };
         },
        toString: function () {
            return this.nodeValue;
        }
     });
    
    XMLDOM.XMLNode = function (config) {
        this.nodeName = config.nodeName;
        this.children = [];
        this.nodeValue = config.nodeValue || "";
        this.attributes = {};
        
        if(config.children) {
            for(var i = 0; i < config.children.length; i++) {
                this.appendChild(XMLDOM.Node.Create(config.children[i]));
            }
        }
        
        if(config.attributes) {
            for(var attr in config.attributes) {
                this.setAttribute(attr, config.attributes[attr]);
            }
        }
    };
    _.extend(XMLDOM.XMLNode.prototype, {
        
        toString: function () {
            var string = "<" + this.nodeName + " ";
            var attrs = [];
            for(var attr in this.attributes) {
                attrs.push(attr + "=\""+this.attributes[attr]+"\"");
            }
            string+= attrs.join(" ") + ">";
            
            for(var i = 0, l = this.children.length; i < l; i++) {
                string += this.children[i].toString();
            }
            
            string += "</" + this.nodeName + ">";
            return string;
        },
        
        toJSON: function () {
            var children = [];
            for(var i = 0, l = this.children.length; i < l; i++) {
                children.push(this.children[i].toJSON());
            }
            return {
                nodeName: this.nodeName,
                children: children,
                nodeValue: this.nodeValue,
                attributes: this.attributes,
                type: "XML"
            };
        },
        
        setAttribute: function (name, val) {
            if(val === null) {
                delete this.attributes[name];
                delete this[name];
                return;
            }
            this.attributes[name] = val;
            this[name] = val;
        },
        setAttributeNS: function (ns, name, val) {
            this.setAttribute(name, val);
        },
        appendChild: function (child) {
            this.children.push(child);
            this.firstChild = this.children[0];
        },
        cloneNode: function () {
            return new XMLDOM.XMLNode(this.toJSON());
        }
    });
    
    return XMLDOM;
});