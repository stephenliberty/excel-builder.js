define(['underscore', './util'], function (_, util) {
    var StyleSheet = function (config) {
        
    };
    _.extend(StyleSheet.prototype, {
        cellStyles: [
            {name:"Normal", formatRecordId:0, builtinId:0}
        ],
        
		cellFormats: [
			{numFmtId:0, fontId:0, fillId:0, borderId:0, formatRecordId:0}
		],
		
		formatRecords: [
			{numFmtId:0, fontId:0, fillId:0, borderId:0}
		],
		
		fonts: [
			{size: 10, name: 'Calibri'}
		],
		
		numberFormats: [
		
		],
		
		fills: [
			{type: 'pattern', patternType: 'none'}
		],
		
        borders: [
            {}
        ],
        
		createBasicCellStyle: function (type) {
            var sid = this.cellFormats.length + 1;
            var style = {
                sid: sid
            };
            switch(type) {
                case 'date':
                    style.numFmtId = 14;
                    break;
            }
            this.cellFormats.push(style);
            return style;
        },
        
		createBorders: function (doc) {
			var borders = util.createElement(doc, 'borders', [
                ['count', this.borders.length]
            ]);
            
            for(var i = 0, l = this.borders.length; i < l; i++) {
                var border = doc.createElement('border');
				var left = doc.createElement('left');
				var right = doc.createElement('right');
				var bottom = doc.createElement('bottom');
				var top = doc.createElement('top');
				var diag = doc.createElement('diagonal');
				
                border.appendChild(left);
				border.appendChild(right);
				border.appendChild(top);
				border.appendChild(bottom);
				border.appendChild(diag);
                borders.appendChild(border);
            }
			return borders;
		},
		
		createCellFormats: function (doc) {
			var cellFormats = util.createElement(doc, 'cellXfs', [
                ['count', this.cellFormats.length]
            ]);
            for(var i = 0, l = this.cellFormats.length; i < l; i++) {
                var style = this.cellFormats[i];
                var format = util.createElement(doc, 'xf', [
					['numFmtId', style.numFmtId || 0],
					['borderId', style.borderId || 0],
					['fontId', style.fontId || 0],
					['fillId', style.fillId || 0],
					['xfId', style.formatRecordId || 0]
				]);
                cellFormats.appendChild(format);
            }
			return cellFormats;
		},
		
		createCellStyles: function (doc) {
			var cellStyles = util.createElement(doc, 'cellStyles', [
				['count', this.cellStyles.length]
			]);
			for(var i = 0, l = this.cellStyles.length; i < l; i++) {
				var style = this.cellStyles[i];
				var cellStyle = util.createElement(doc, 'cellStyle', [
					['name', style.name],
					['xfId', style.formattingRecordId || 0],
					['builtinId', style.builtinId || 0]
				]);
				cellStyles.appendChild(cellStyle);
			}
			
			return cellStyles;
		},
		
		createFormattingRecords: function (doc) {
			var records = util.createElement(doc, 'cellStyleXfs', [
				['count', this.formatRecords.length]
			]);
			for(var i = 0, l = this.formatRecords.length; i < l; i++) {
				var record = util.createElement(doc, 'xf', [
					['numFmtId', this.formatRecords[i].numFmtId],
					['fontId', this.formatRecords[i].fontId],
					['fillId', this.formatRecords[i].fillId],
					['borderId', this.formatRecords[i].borderId]
				]);
				records.appendChild(record);
			}
			return records;
		},
		
		createFonts: function (doc) {
			var fonts = util.createElement(doc, 'fonts', [
				['count', this.fonts.length],
				['x14ac:knownFonts', 1]
			]);
			for(var i = 0, l = this.fonts.length; i < l; i++) {
				var fd = this.fonts[i];
				var font = util.createElement(doc, 'font');
				if(fd.size) {
					font.appendChild(util.createElement(doc, 'sz', [
						['val', fd.size]
					]));
				}
				
				if(fd.name) {
					font.appendChild(util.createElement(doc, 'name', [
						['val', fd.name]
					]));
				}
				fonts.appendChild(font);
			}
			return fonts;
		},
		
		createFills: function (doc) {
			var fills = util.createElement(doc, 'fills', [
				['count', this.formatRecords.length]
			]);
			for(var i = 0, l = this.fills.length; i < l; i++) {
				var fd = this.fills[i];
				var fill = util.createElement(doc, 'fill');
				if(fd.type == 'pattern') {
					fill.appendChild(util.createElement(doc, 'patternFill', [
						['patternType', fd.patternType]
					]));
				}
				fills.appendChild(fill);
			}
			return fills;
		},
		
        toXML: function () {
            var styles = this.cellStyles;
            
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'styleSheet');
            var styleSheet = doc.documentElement;
            styleSheet.setAttribute('xmlns:mc', "http://schemas.openxmlformats.org/markup-compatibility/2006");
            styleSheet.setAttribute('xmlns:x14ac', "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac");
            styleSheet.setAttribute('mc:Ignorable', "x14ac");
			styleSheet.appendChild(this.createFonts(doc));
            styleSheet.appendChild(this.createFills(doc));
            styleSheet.appendChild(this.createBorders(doc));
			styleSheet.appendChild(this.createFormattingRecords(doc));
            styleSheet.appendChild(this.createCellFormats(doc));
            styleSheet.appendChild(this.createCellStyles(doc));
			console.log(styleSheet);
			return doc;
        }
    });
    return StyleSheet;
});