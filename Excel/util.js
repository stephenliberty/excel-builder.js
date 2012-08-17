define([], function () {
    return {
        createXmlDoc: function (ns, base) {
            if(document.implementation && document.implementation.createDocument) {
                return document.implementation.createDocument(ns || null, base, null);
            } else if (window.ActiveXObject) {
                var doc = new ActiveXObject( "Microsoft.XMLDOM" );
                var rootNode = doc.createElement(base);
                rootNode.setAttribute('xmlns', ns);
                doc.appendChild(rootNode);
                return doc;
            }
            throw "No xml document generator";
        },
        
        createElement: function (doc, name, attributes) {
            var el = doc.createElement(name);
            var ie = !el.setAttributeNS
            attributes = attributes || [];
            var i = attributes.length;
            while (i--) {
                if(!ie && attributes[i][0].indexOf('xmlns') != -1) {
                    el.setAttributeNS("http://www.w3.org/2000/xmlns/", attributes[i][0], attributes[i][1])
                } else {
                    el.setAttribute(attributes[i][0], attributes[i][1])
                }
            }
            return el;
        },
        
        schemas: {
            'worksheet': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
            'sharedStrings': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings",
            'stylesheet': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            'relationships': "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            'contentTypes': "http://schemas.openxmlformats.org/package/2006/content-types",
            'spreadsheetml': "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
            'markupCompat': "http://schemas.openxmlformats.org/markup-compatibility/2006",
            'x14ac': "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac",
            'officeDocument': "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
            'package': "http://schemas.openxmlformats.org/package/2006/relationships"
        }
    }
})