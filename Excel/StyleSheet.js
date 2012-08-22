define(['underscore', './util'], function (_, util) {
    var StyleSheet = function (config) {
        
    };
    _.extend(StyleSheet.prototype, {
        cellStyles: [
            {}
        ],
        
		cellFormats: [
			{}
		],
		
		formatRecords: [
			{}
		],
		
		fonts: [
			{}
		],
		
		numberFormats: [
		
		],
		
		fills: [
			{}
		],
		
        borders: [
            {}
        ],
        
		createSimpleFormatter: function (type) {
            var sid = this.cellFormats.length;
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
                var format = util.createElement(doc, 'xf');
				if(style.numFmtId) {
					format.setAttribute('numFmtId', style.numFmtId);
				}
                cellFormats.appendChild(format);
            }
			return cellFormats;
		},
		
		createFormattingRecords: function (doc) {
			var records = util.createElement(doc, 'cellStyleXfs', [
				['count', this.formatRecords.length]
			]);
			for(var i = 0, l = this.formatRecords.length; i < l; i++) {
				var record = util.createElement(doc, 'xf');
				records.appendChild(record);
			}
			return records;
		},
		
		createFonts: function (doc) {
			var fonts = util.createElement(doc, 'fonts', [
				['count', this.fonts.length]
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
			styleSheet.appendChild(this.createFonts(doc));
            styleSheet.appendChild(this.createFills(doc));
            styleSheet.appendChild(this.createBorders(doc));
			styleSheet.appendChild(this.createFormattingRecords(doc));
            styleSheet.appendChild(this.createCellFormats(doc));
			console.log(styleSheet);
			return doc;
        }
    });
    return StyleSheet;
});