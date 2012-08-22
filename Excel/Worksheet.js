define(['underscore', './util'], function (_, util) {
    var Worksheet = function (config) {
        this.initialize(config);
    };
    _.extend(Worksheet.prototype, {
        
        columnFormats: [],
        
        data: [],
        
        columns: [],
        
		_header: [],
		
        initialize: function (config) {
            config = config || {}
            this.name = config.name;
			this._excelStartDate = new Date(1900, 1, 1, 0, 0, 0, 0).getTime();
            if(config.columns) {
                this.setColumns(config.columns);
            }
        },
		
		addHeader: function (rows) {
			this._header = rows;
		},
		
		exportHeader: function (doc, sheetData) {
			for(var i = 0, l = this._header.length; i < l; i++) {
				var rowNode = util.createElement(doc, 'row');
                
                for(var c = 0; c < cellCount; c++) {
                    var cell = createCell(doc, metadata, data)
                    rowNode.appendChild(cell);
                }
                sheetData.appendChild(rowNode);
			}
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
			this.exportHeader(doc, sheetData);
			
            for(var row = 0, l = data.length; row < l; row++) {
                var dataRow = data[row];
                var cellCount = dataRow.length;
                maxX = cellCount > maxX ? cellCount : maxX;
                var rowNode = util.createElement(doc, 'row');
                
				for(var c = 0; c < cellCount; c++) {
					columns[c] = columns[c] || {};
					var cellMetadata = {
						type: columns[c].type || 'text',
						style: columns[c].style || ''
					};
                    var cell = this.createCell(doc, cellMetadata, dataRow[c])
                    rowNode.appendChild(cell);
                }
                sheetData.appendChild(rowNode);
            } 
            
            var dimension = util.createElement(doc, 'dimension', [
                ['ref', 'A1:'+Worksheet.COLUMN_HEADER_MAP[maxX]+data.length]
            ]);
            worksheet.appendChild(dimension);
            worksheet.appendChild(cols);
            worksheet.appendChild(sheetData);
            return doc;
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
    
    Worksheet.COLUMN_HEADER_MAP = [];
    for(var i = 0; i < 26; i++) {
        var letterKey = "", icopy = i;
        if(icopy > 25) {
            //Figure out what to do here.. it has to start going AA, AB..... AMJ
        } else {
            letterKey = String.fromCharCode(icopy + 65);
        }
        Worksheet.COLUMN_HEADER_MAP[i] = letterKey;
    }
    return Worksheet;
});