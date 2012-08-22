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
		
		createStyle: function (styleInstructions) {
			var sid = this.cellFormats.length;
			var style = {
				sid: sid
			};
			console.log(style)
			if(styleInstructions.font && _.isObject(styleInstructions.font)) {
				console.log('blah')
				style.fontId = this.createFontStyle(styleInstructions.font).fontId;
			} else if(styleInstructions.font) {
				if(_.isNaN(parseInt(styleInstructions.font, 10))) {
					throw "Passing a non-numeric font id is not supported";
				}
				style.fontId = styleInstructions.font;
			}
			
			this.cellFormats.push(style);
			return style;
		},
		
		/**
		 * Supported font styles:
		 * bold
		 * italic
		 * underline (single, double, singleAccounting, doubleAccounting)
		 * size
		 * color
		 * fontName
		 * strike (strikethrough)
		 * outline (does this actually do anything?)
		 * shadow (does this actually do anything?)
		 * superscript
		 * subscript
		 *
		 * Color is a future goal - at the moment it's looking a bit complicated
		 */
		createFontStyle: function (instructions) {
			var fontId = this.fonts.length;
			var fontStyle = {
				fontId: fontId
			};
			if(instructions.bold) {
				fontStyle.bold = true;
			}
			if(instructions.italic) {
				fontStyle.italic = true;
			}
			if(instructions.superscript) {
				fontStyle.vertAlign = 'superscript';
			}
			if(instructions.subscript) {
				fontStyle.vertAlign = 'subscript';
			}
			if(instructions.underline) {
				if(_.indexOf([
					'double',
					'singleAccounting',
					'doubleAccounting'
				], instructions.underline) != -1) {
					fontStyle.underline = instructions.underline;
				} else {
					fontStyle.underline = true;
				}
			}
			if(instructions.strike) {
				fontStyle.strike = true;
			}
			if(instructions.outline) {
				fontStyle.outline = true;
			}
			if(instructions.shadow) {
				fontStyle.shadow = true;
			}
			if(instructions.size) {
				fontStyle.size = instructions.size;
			}
			if(instructions.color) {
				//going to be complicated
			}
			if(instructions.fontName) {
				fontStyle.fontName = instructions.fontName;
			}
			this.fonts.push(fontStyle);
			return fontStyle;
		},
        
		exportBorders: function (doc) {
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
		
		exportCellFormats: function (doc) {
			var cellFormats = util.createElement(doc, 'cellXfs', [
                ['count', this.cellFormats.length]
            ]);
            for(var i = 0, l = this.cellFormats.length; i < l; i++) {
                var style = this.cellFormats[i];
                var format = util.createElement(doc, 'xf');
				if(style.fontId) {
					format.setAttribute('fontId', style.fontId);
				}
				if(style.numFmtId) {
					format.setAttribute('numFmtId', style.numFmtId);
				}
                cellFormats.appendChild(format);
            }
			return cellFormats;
		},
		
		exportFormattingRecords: function (doc) {
			var records = util.createElement(doc, 'cellStyleXfs', [
				['count', this.formatRecords.length]
			]);
			for(var i = 0, l = this.formatRecords.length; i < l; i++) {
				var record = util.createElement(doc, 'xf');
				records.appendChild(record);
			}
			return records;
		},
		
		exportFonts: function (doc) {
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
				
				if(fd.fontName) {
					font.appendChild(util.createElement(doc, 'name', [
						['val', fd.name]
					]));
				}
				
				if(fd.bold) { font.appendChild(doc.createElement('b')); }
				if(fd.italic) { font.appendChild(doc.createElement('i')); }
				if(fd.vertAlign) {
					font.appendChild(util.createElement(doc, 'vertAlign', [
						['val', fd.vertAlign]
					]));
				}
				if(fd.underline) { 
					var u = doc.createElement('u');
					if(fd.underline !== true) {
						u.setAttribute('val', fd.underline);
					}
					font.appendChild(u); 
				}
				if(fd.strike) { font.appendChild(doc.createElement('strike')); }
				if(fd.shadow) { font.appendChild(doc.createElement('shadow')); }
				if(fd.outline) { font.appendChild(doc.createElement('outline')); }
				fonts.appendChild(font);
			}
			return fonts;
		},
		
		exportFills: function (doc) {
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
			styleSheet.appendChild(this.exportFonts(doc));
            styleSheet.appendChild(this.exportFills(doc));
            styleSheet.appendChild(this.exportBorders(doc));
			styleSheet.appendChild(this.exportFormattingRecords(doc));
            styleSheet.appendChild(this.exportCellFormats(doc));
			console.log(styleSheet);
			return doc;
        }
    });
    return StyleSheet;
});