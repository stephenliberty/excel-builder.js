define(['underscore', 
    './util', 
    './StyleSheet', 
    './Worksheet',
    './RelationshipManager'
], function (_, util, StyleSheet, Worksheet, RelationshipManager) {
    var Workbook = function (config) {
        this.initialize(config);
    };
    _.extend(Workbook.prototype, {
        
        worksheets: [],
        
        initialize: function (config) {
            this.styleSheet = new StyleSheet();
            this.relations = new RelationshipManager();
        },
        
        createWorksheet: function (config) {
            config = config || {}
            _.defaults(config, {
                name: 'Sheet '.concat(this.worksheets.length + 1)
            })
            return new Worksheet(config);
        },
        
        getStyleSheet: function () {
            return this.styleSheet;
        },
        
        addWorksheet: function (worksheet) {
            this.worksheets.push(worksheet);
        },
        
        createContentTypes: function () {
            var doc = util.createXmlDoc(util.schemas.contentTypes, 'Types');
            var types = doc.documentElement;
            types.setAttribute('xmlns:r', util.schemas.contentTypes);
            //doc.appendChild(types)
            types.appendChild(util.createElement(doc, 'Default', [
                ['Extension', "rels"],
                ['ContentType', "application/vnd.openxmlformats-package.relationships+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Default', [
                ['Extension', "xml"],
                ['ContentType', "application/xml"]
            ]));
            
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/workbook.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"]
            ]));
            //this.relations.addRelation("workbook.xml", 'spreadsheetml');
            
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/styles.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"]
            ]));
            this.relations.addRelation("styles.xml", 'stylesheet');
            
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', "/worksheets/sheet" + (i + 1) + ".xml"],
                    ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"]
                ]));
                this.relations.addRelation("worksheets/sheet" + (i + 1) + ".xml", 'worksheet');
            }
            return doc;
        },
        
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'workbook');
            var wb = doc.documentElement;
            wb.setAttribute('xmlns:r', util.schemas.relationships);
            
            var sheets = util.createElement(doc, 'sheets');
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                var sheet = util.createElement(doc, 'sheet', [
                    ['name', this.worksheets[i].name],
                    ['sheetId', i+1],
                    ['r:id', this.relations.getRelationshipId('worksheets/sheet' + (i + 1) + '.xml')]
                ]);
                sheets.appendChild(sheet);
            }
            wb.appendChild(sheets);
            return doc;
        },
        
        createWorkbookRelationship: function () {
            var doc = util.createXmlDoc(util.schemas['package'], 'Relationships');
            var relationships = doc.documentElement;
            relationships.appendChild(util.createElement(doc, 'Relationship', [
                ['Id', 'rId1'],
                ['Type', util.schemas.officeDocument],
                ['Target', 'workbook.xml']
            ]));
            return doc;
        },
        
        generateFiles: function () {
            
            var files = {
                '/[Content_Types].xml': this.createContentTypes(),
                '/_rels/.rels': this.createWorkbookRelationship(),
                '/styles.xml': this.styleSheet.toXML(),
                '/workbook.xml': this.toXML(),
                '/_rels/workbook.xml.rels': this.relations.toXML()
            }
            
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                files['/worksheets/sheet' + (i + 1) + '.xml'] = this.worksheets[i].toXML();
            }
            
            _.each(files, function (value, key) {
                files[key] = value.xml || new XMLSerializer().serializeToString(value);  
                files[key] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "\n" + files[key].replace(/xmlns=""/g, '')
            });
            
            console.log(files['/styles.xml'])
            
            return files;
        }
    });
    return Workbook;
});