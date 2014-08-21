/**
 * @module Excel/Workbook
 */
define([
    'require',
    'underscore', 
    './util', 
    './StyleSheet', 
    './Worksheet',
    './SharedStrings',
    './RelationshipManager',
    './Paths',
    './XMLDOM'
], 
function (require, _, util, StyleSheet, Worksheet, SharedStrings, RelationshipManager, Paths, XMLDOM) {
    "use strict";
    var Workbook = function (config) {
        this.worksheets = [];
        this.tables = [];
        this.drawings = [];
        this.media = {};
        this.initialize(config);
    };
    _.extend(Workbook.prototype, {

        initialize: function () {
            this.id = _.uniqueId('Workbook');
            this.styleSheet = new StyleSheet();
            this.sharedStrings = new SharedStrings();
            this.relations = new RelationshipManager();
            this.relations.addRelation(this.styleSheet, 'stylesheet');
            this.relations.addRelation(this.sharedStrings, 'sharedStrings');
        },

        createWorksheet: function (config) {
            config = config || {};
            _.defaults(config, {
                name: 'Sheet '.concat(this.worksheets.length + 1)
            });
            return new Worksheet(config);
        },
        
        getStyleSheet: function () {
            return this.styleSheet;
        },

        addTable: function (table) {
            this.tables.push(table);
        },
                
        addDrawings: function (drawings) {
            this.drawings.push(drawings);
        },
        
        addMedia: function (type, fileName, fileData, contentType) {
            var fileNamePieces = fileName.split('.');
            var extension = fileNamePieces[fileNamePieces.length - 1];
            if(!contentType) {
                switch(extension.toLowerCase()) {
                    case 'jpeg':
                    case 'jpg':
                        contentType = "image/jpeg";
                        break;
                    case 'png': 
                        contentType = "image/png";
                        break;
                    case 'gif': 
                        contentType = "image/gif";
                        break;
                    default: 
                        contentType = null;
                        break;
                }
            }
            if(!this.media[fileName]) {
                this.media[fileName] = {
                    id: fileName,
                    data: fileData,
                    fileName: fileName,
                    contentType: contentType,
                    extension: extension
                };
            }
            return this.media[fileName];
        },
        
        addWorksheet: function (worksheet) {
            this.relations.addRelation(worksheet, 'worksheet');
            worksheet.setSharedStringCollection(this.sharedStrings);
            this.worksheets.push(worksheet);
        },

        createContentTypes: function () {
            var doc = util.createXmlDoc(util.schemas.contentTypes, 'Types');
            var types = doc.documentElement;
            var i, l;
            
            types.appendChild(util.createElement(doc, 'Default', [
                ['Extension', "rels"],
                ['ContentType', "application/vnd.openxmlformats-package.relationships+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Default', [
                ['Extension', "xml"],
                ['ContentType', "application/xml"]
            ]));
            
            var extensions = {};
            for(var filename in this.media) {
                if(this.media.hasOwnProperty(filename)) {
                    extensions[this.media[filename].extension] = this.media[filename].contentType;
                }
            }
            for(var extension in extensions) {
                if(extensions.hasOwnProperty(extension)) {
                    types.appendChild(util.createElement(doc, 'Default', [
                        ['Extension', extension],
                        ['ContentType', extensions[extension]]
                    ]));
                }
            }
            
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/xl/workbook.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/xl/sharedStrings.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"]
            ]));
            types.appendChild(util.createElement(doc, 'Override', [
                ['PartName', "/xl/styles.xml"],
                ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"]
            ]));

            for(i = 0, l = this.worksheets.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', "/xl/worksheets/sheet" + (i + 1) + ".xml"],
                    ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"]
                ]));
            }
            for(i = 0, l = this.tables.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', "/xl/tables/table" + (i + 1) + ".xml"],
                    ['ContentType', "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"]
                ]));
            }
            
            for(i = 0, l = this.drawings.length; i < l; i++) {
                types.appendChild(util.createElement(doc, 'Override', [
                    ['PartName', '/xl/drawings/drawing' + (i + 1) + '.xml'],
                    ['ContentType', 'application/vnd.openxmlformats-officedocument.drawing+xml']
                ]));
            }
            
            return doc;
        },

        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'workbook');
            var wb = doc.documentElement;
            wb.setAttribute('xmlns:r', util.schemas.relationships);

            var maxWorksheetNameLength = 31;
            var sheets = util.createElement(doc, 'sheets');
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                var sheet = doc.createElement('sheet');
                // Microsoft Excel (2007, 2013) do not allow worksheet names longer than 31 characters
                // if the worksheet name is longer, Excel displays an "Excel found unreadable content..." popup when opening the file
                if(console != null && this.worksheets[i].name.length > maxWorksheetNameLength) {
                    console.log('Microsoft Excel requires work sheet names to be less than ' + (maxWorksheetNameLength+1) +
                            ' characters long, work sheet name "' + this.worksheets[i].name +
                            '" is ' + this.worksheets[i].name.length + ' characters long');
                }
                sheet.setAttribute('name', this.worksheets[i].name);
                sheet.setAttribute('sheetId', i + 1);
                sheet.setAttribute('r:id', this.relations.getRelationshipId(this.worksheets[i]));
                sheets.appendChild(sheet);
            }
            wb.appendChild(sheets);
            return doc;
        },

        createWorkbookRelationship: function () {
            var doc = util.createXmlDoc(util.schemas.relationshipPackage, 'Relationships');
            var relationships = doc.documentElement;
            relationships.appendChild(util.createElement(doc, 'Relationship', [
                ['Id', 'rId1'],
                ['Type', util.schemas.officeDocument],
                ['Target', 'xl/workbook.xml']
                ]));
            return doc;
        },
        
        _generateCorePaths: function (files) {
            var i, l;
            Paths[this.styleSheet.id] = 'styles.xml';
            Paths[this.sharedStrings.id] = 'sharedStrings.xml';
            Paths[this.id] = '/xl/workbook.xml';
            
            for(i = 0, l = this.tables.length; i < l; i++) {
                files['/xl/tables/table' + (i + 1) + '.xml'] = this.tables[i].toXML();
                Paths[this.tables[i].id] = '/xl/tables/table' + (i + 1) + '.xml';
            }
            
            for(var fileName in this.media) {
                if(this.media.hasOwnProperty(fileName)) {
                    var media = this.media[fileName];
                    files['/xl/media/' + fileName] = media.data;
                    Paths[fileName] = '/xl/media/' + fileName;
                }
            }
            
            for(i = 0, l = this.drawings.length; i < l; i++) {
                files['/xl/drawings/drawing' + (i + 1) + '.xml'] = this.drawings[i].toXML();
                Paths[this.drawings[i].id] = '/xl/drawings/drawing' + (i + 1) + '.xml';
                files['/xl/drawings/_rels/drawing' + (i + 1) + '.xml.rels'] = this.drawings[i].relations.toXML();
            }
            
            
        },
        
        _prepareFilesForPackaging: function (files) {
            
            _.extend(files, {
                '/[Content_Types].xml': this.createContentTypes(),
                '/_rels/.rels': this.createWorkbookRelationship(),
                '/xl/styles.xml': this.styleSheet.toXML(),
                '/xl/workbook.xml': this.toXML(),
                '/xl/sharedStrings.xml': this.sharedStrings.toXML(),
                '/xl/_rels/workbook.xml.rels': this.relations.toXML()
            });

            _.each(files, function (value, key) {
                if(key.indexOf('.xml') !== -1 || key.indexOf('.rels') !== -1) {
                    if (value instanceof XMLDOM){
                        files[key] = value.toString();
                    } else {
                        files[key] = value.xml || new window.XMLSerializer().serializeToString(value);
                    }
                    var content = files[key].replace(/xmlns=""/g, '');
                    content = content.replace(/NS[\d]+:/g, '');
                    content = content.replace(/xmlns:NS[\d]+=""/g, '');
                    files[key] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "\n" + content;
                }
            });
        },
        
        generateFilesAsync: function (options) {
            var requireJsPath = options.requireJsPath;
            var self = this;
            if(!options.requireJsPath) {
                requireJsPath = document.getElementById('requirejs') ? document.getElementById('requirejs').src : '';
            }
            if(!requireJsPath) {
                throw "Please add 'requirejs' to the script that includes requirejs, or specify the path as an argument";
            }
            var files = {},
                doneCount = this.worksheets.length,
                stringsCollectedCount = this.worksheets.length,
                workers = [];
            
            var result = {
                status: "Not Started",
                terminate: function () {
                    for(var i = 0; i < workers.length; i++) {
                        workers[i].terminate();
                    }
                }
            };
            this._generateCorePaths(files);
            
            var done = function () {
                if(--doneCount === 0) {
                    self._prepareFilesForPackaging(files);
                    for(var i = 0; i < workers.length; i++) {
                        workers[i].terminate();
                    }
                    options.success(files);
                }
            };
            var stringsCollected = function () {
                if(--stringsCollectedCount === 0) {
                    for(var i = 0; i < workers.length; i++) {
                        workers[i].postMessage({
                            instruction: 'export',
                            sharedStrings: self.sharedStrings.exportData()
                        });
                    }
                }
            };
            
            
            var worksheetWorker = function (worksheetIndex) {
                return {
                    error: function () {
                        for(var i = 0; i < workers.length; i++) {
                            workers[i].terminate();
                        }
                        //message, filename, lineno
                        options.error.apply(this, arguments);
                    },
                    stringsCollected: function () {
                        stringsCollected();
                    },
                    finished: function (data) {
                        files['/xl/worksheets/sheet' + (worksheetIndex + 1) + '.xml'] = {xml: data};
                        Paths[self.worksheets[worksheetIndex].id] = 'worksheets/sheet' + (worksheetIndex + 1) + '.xml';
                        files['/xl/worksheets/_rels/sheet' + (worksheetIndex + 1) + '.xml.rels'] = self.worksheets[worksheetIndex].relations.toXML();
                        done();
                    }
                };
            };
            
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                workers.push(
                    this._createWorker(requireJsPath, i, worksheetWorker(i))
                );
            }
            
            return result;
        },
                
        _createWorker: function (requireJsPath, worksheetIndex, callbacks) {
            var worker = new window.Worker(require.toUrl('./WorksheetExportWorker.js'));
            var self = this;
            worker.addEventListener('error', callbacks.error);
            worker.addEventListener('message', function(event) {
//                console.log("Called back by the worker!\n", event.data);
                switch(event.data.status) {
                    case "ready":
                        worker.postMessage({
                            instruction: 'start',
                            data: self.worksheets[worksheetIndex].exportData()
                        });
                        break;
                    case "sharedStrings":
                        for(var i = 0; i < event.data.data.length; i++) {
                            self.sharedStrings.addString(event.data.data[i]);
                        }
                        callbacks.stringsCollected();
                        break;
                    case "finished":
                        callbacks.finished(event.data.data);
                        break;
                }
            }, false);
            worker.postMessage({
                instruction: 'setup',
                config: {
                    paths: {
                        underscore: require.toUrl('underscore').slice(0, -3)
                    },
                    shim: {
                        'underscore': {
                            exports: '_'
                        }
                    }
                },
                requireJsPath: requireJsPath
            });
            return worker;
        },
        
        generateFiles: function () {
            var files = {};
            this._generateCorePaths(files);
            
            
            for(var i = 0, l = this.worksheets.length; i < l; i++) {
                files['/xl/worksheets/sheet' + (i + 1) + '.xml'] = this.worksheets[i].toXML();
                Paths[this.worksheets[i].id] = 'worksheets/sheet' + (i + 1) + '.xml';
                files['/xl/worksheets/_rels/sheet' + (i + 1) + '.xml.rels'] = this.worksheets[i].relations.toXML();
            }
            
            this._prepareFilesForPackaging(files);

            return files;
        }
    });
    return Workbook;
});