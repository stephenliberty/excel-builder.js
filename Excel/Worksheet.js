"use strict";
define(['underscore', './util', './RelationshipManager', './Table'], function (_, util, RelationshipManager, Table) {
    var Worksheet = function (config) {
        this.relations = null;
        this.columnFormats = [];
        this.data = [];
        this.columns = [];
        this._headers = [];
        this._footers = [];
        this._tables = [];
        this.initialize(config);
    };
    $.extend(true, Worksheet.prototype, {
		
        initialize: function (config) {
            config = config || {};
            this.name = config.name;
            this.id = _.uniqueId('Worksheet');
            this._excelStartDate = new Date(1900, 1, 1, 0, 0, 0, 0).getTime();
            if(config.columns) {
                this.setColumns(config.columns);
            }
			
            this.relations = new RelationshipManager();
        },
		
        addTable: function (table) {
            this._tables.push(table);
            this.relations.addRelation(table, 'table');
        },
		
        /**
        * Expects an array length of three.
        * [left, center, right]
        */
        setHeader: function (headers) {
            if(!_.isArray(headers)) {
                throw "Invalid argument type - setHeader expects an array of three instructions";
            }
            this._headers = headers;
        },
		
        /**
        * Expects an array length of three.
        * [left, center, right]
        */
        setFooter: function (footers) {
            if(!_.isArray(footers)) {
                throw "Invalid argument type - setFooter expects an array of three instructions";
            }
            this._footers = footers;
        },
		
        exportHeader: function (doc) {
            var oddHeader = doc.createElement('oddHeader');
            oddHeader.appendChild(doc.createTextNode(util.compilePageDetailPackage(this._headers)));
            return oddHeader;
        },
		
        exportFooter: function (doc) {
            var oddFooter = doc.createElement('oddFooter');
            oddFooter.appendChild(doc.createTextNode(util.compilePageDetailPackage(this._footers)));
            return oddFooter;
        },
		
        createCell: function (doc, metadata, data, cellCache) {
            
        },
	
        _buildCache: function (doc) {
            var numberNode = doc.createElement('c');
            var value = doc.createElement('v');
            value.appendChild(doc.createTextNode(""));
            numberNode.appendChild(value);
            var stringNode = doc.createElement('c');
            stringNode.setAttribute('t', 'inlineStr');
            var is = doc.createElement('is');
            var t = doc.createElement('t');
            t.appendChild(doc.createTextNode(""));
            is.appendChild(t);
            stringNode.appendChild(is);
            return {
                number: numberNode,
                date: numberNode,
                string: stringNode
            }
        },
        
        toXML: function () {
            var data = this.data;
            var columns = this.columns || [];
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'worksheet');
            var worksheet = doc.documentElement;
            worksheet.setAttribute('xmlns:r', util.schemas.relationships);
            worksheet.setAttribute('xmlns:mc', util.schemas.markupCompat);
            
            var maxX = 0;
            var sheetData = util.createElement(doc, 'sheetData');
            
            var cellCache = this._buildCache(doc);
            
            for(var row = 0, l = data.length; row < l; row++) {
                var dataRow = data[row];
                var cellCount = dataRow.length;
                maxX = cellCount > maxX ? cellCount : maxX;
                var rowNode = doc.createElement('row');
                
                for(var c = 0; c < cellCount; c++) {
                    columns[c] = columns[c] || {};
                    var cellValue = dataRow[c];
                    if (typeof dataRow[c] == 'object') {
                        cellValue = dataRow[c].value;
                    }
                    
                    var cell, metadata = dataRow[c].metadata || {};
			
            
                    if(!metadata.type) {
                        if(typeof cellValue == 'number') {
                            metadata.type = 'number';
                        }
                    }

                    switch(metadata.type) {
                        case "number":
                            cell = cellCache.number.cloneNode(true);
                            cell.firstChild.firstChild.nodeValue = cellValue;
                            break;
                        case "date":
                            cell = cellCache.date.cloneNode(true);
                            cell.firstChild.firstChild.nodeValue = (cellValue - this._excelStartDate)  / (60 * 60 * 24) / 1000;
                            break;
                        case "text":
                        default:
                            cell = cellCache.string.cloneNode(true);
                            cell.firstChild.firstChild.firstChild.nodeValue = cellValue;
                            break;
                    };
                    if(metadata.style) {
                        cell.setAttribute('s', metadata.style);
                    }
                    
                    rowNode.appendChild(cell);
                }
                sheetData.appendChild(rowNode);
            } 
            
            var dimension = util.createElement(doc, 'dimension', [
                ['ref',  util.positionToLetterRef(1, 1) + ':' + util.positionToLetterRef(maxX, data.length)]
                ]);
			
            worksheet.appendChild(dimension);
            
            if(this.columns.length) {
                worksheet.appendChild(this.exportColumns(doc));
            }
            worksheet.appendChild(sheetData);
			
            this.exportPageSettings(doc, worksheet);
			
            if(this._headers.length > 0 || this._footers.length > 0) {
                var headerFooter = doc.createElement('headerFooter');
                if(this._headers.length > 0) {
                    headerFooter.appendChild(this.exportHeader(doc));
                }
                if(this._footers.length > 0) {
                    headerFooter.appendChild(this.exportFooter(doc));
                }
                worksheet.appendChild(headerFooter);
            }
			
            if(this._tables.length > 0) {
                var tables = doc.createElement('tableParts');
                tables.setAttribute('count', this._tables.length);
                for(var i = 0, l = this._tables.length; i < l; i++) {
                    var table = doc.createElement('tablePart');
                    table.setAttribute('r:id', this.relations.getRelationshipId(this._tables[i]));
                    tables.appendChild(table);
                }
                worksheet.appendChild(tables);
            }
			
            return doc;
        },
        
        exportColumns: function (doc) {
            var cols = util.createElement(doc, 'cols');
            for(var i = 0, l = this.columns.length; i < l; i++) {
                var cd = this.columns[i];
                var col = util.createElement(doc, 'col', [
                    ['min', cd.min || i + 1],
                    ['max', cd.max || i + 1]
                ]);
                if (cd.hidden) {
                    col.setAttribute('hidden', 1);
                }
                if(cd.bestFit) {
                    col.setAttribute('bestFit', 1);
                }
                if(cd.customWidth) {
                    col.setAttribute('customWidth', 1);
                }
                if(cd.width) {
                    col.setAttribute('width', cd.width);
                } else {
                    col.setAttribute('width', 9.140625);
                }
                
                cols.appendChild(col)
            };
            return cols;
        },
        
        exportPageSettings: function (doc, worksheet) {
			
            if(this._orientation) {
                worksheet.appendChild(util.createElement(doc, 'pageSetup', [
                    ['orientation', this._orientation]
                    ]));
            }
        },
		
        setPageOrientation: function (orientation) {
            this._orientation = orientation;
        },
		
        /**
         * Expects an array containing the data type to default to for each column's cell
         */
        setColumns: function (columns) {
            this.columns = columns;
            this.styles = [];
            
        },
        
        setData: function (data) {
            this.data = data;
        },
        
        /**
         * Expects an array containing an object full of column format definitions.
         * http://msdn.microsoft.com/en-us/library/documentformat.openxml.spreadsheet.column.aspx
         * bestFit
         * collapsed
         * customWidth
         * hidden
         * max
         * min
         * outlineLevel 
         * phonetic
         * style
         * width
         */
        setColumnFormats: function (columnFormats) {
            this.columnFormats = columnFormats;
        }
    });
    return Worksheet;
});
