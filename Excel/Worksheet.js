"use strict";
define(['underscore', './util', './RelationshipManager', './Table'], function (_, util, RelationshipManager, Table) {
    var Worksheet = function (config) {
        this.initialize(config);
    };
    _.extend(Worksheet.prototype, {
        
		relations: null,
		
        columnFormats: [],
        
        data: [],
        
        columns: [],
        
		_headers: [],
		
		_footers: [],
		
		_tables: [],
		
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
			if(!_.isArray(headers)) {throw "Invalid argument type - setHeader expects an array of three instructions";}
			this._headers = headers;
		},
		
		/**
		* Expects an array length of three.
		* [left, center, right]
		*/
		setFooter: function (footers) {
			if(!_.isArray(footers)) {throw "Invalid argument type - setFooter expects an array of three instructions";}
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
		
		createCell: function (doc, metadata, data) {
			var cell = util.createElement(doc, 'c'), value, textNode;
			
			if(metadata.style) {
				cell.setAttribute('s', metadata.style);
			}
			
			switch(metadata.type) {
				case "number":
					value = util.createElement(doc, 'v');
					textNode = doc.createTextNode(data);
					break;
				case "date":
					value = util.createElement(doc, 'v');
					textNode = doc.createTextNode((data - this._excelStartDate)  / (60 * 60 * 24) / 1000);
					break;
				case "text":
				default: 
					value = util.createElement(doc, 'is');
					cell.setAttribute('t', 'inlineStr');
					textNode = util.createElement(doc, 't');
					var stringNode = doc.createTextNode(data);
					textNode.appendChild(stringNode)
					break;
			};
			value.appendChild(textNode);
			cell.appendChild(value);
			return cell;
		},
		
        toXML: function () {
            var data = this.data;
            var columns = this.columns || [];
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'worksheet');
            var worksheet = doc.documentElement;
            worksheet.setAttribute('xmlns:r', util.schemas.relationships);
            worksheet.setAttribute('xmlns:mc', util.schemas.markupCompat);
            
            var cols = util.createElement(doc, 'cols');
            
			for(var i = 0, l = this.columns.length; i < l; i++) {
                var col = util.createElement(doc, 'col', [
                    ['min', i + 1],
                    ['max', i + 1],
					['width', 9.140625]
                ]);
                if(this.columns[i].bestFit) {
                    col.setAttribute('bestFit', 1);
                }
                if(this.columns[i].width) {
                    col.setAttribute('width', this.columns[i].width);
                }
                cols.appendChild(col)
            };
            
            var maxX = 0;
            var sheetData = util.createElement(doc, 'sheetData');
			
            for(var row = 0, l = data.length; row < l; row++) {
                var dataRow = data[row];
                var cellCount = dataRow.length;
                maxX = cellCount > maxX ? cellCount : maxX;
                var rowNode = util.createElement(doc, 'row');
                
				for(var c = 0; c < cellCount; c++) {
					columns[c] = columns[c] || {};
					var cellValue = dataRow[c];
					var cellMetadata = {
						type: columns[c].type || 'text',
						style: columns[c].style || ''
					};
					if (_.isObject(dataRow[c])) {
						cellValue = dataRow[c].value;
						_.extend(cellMetadata, dataRow[c].metadata);
					}
                    var cell = this.createCell(doc, cellMetadata, cellValue)
                    rowNode.appendChild(cell);
                }
                sheetData.appendChild(rowNode);
            } 
            
            var dimension = util.createElement(doc, 'dimension', [
                ['ref',  util.positionToLetterRef(1, 1) + [maxX, data.length]]
            ]);
			
            worksheet.appendChild(dimension);
            worksheet.appendChild(cols);
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
					table.setAttribute('r:Id', this.relations.getRelationshipId(this._tables[i]));
				}
				worksheet.appendChild(tables);
			}
			
			return doc;
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