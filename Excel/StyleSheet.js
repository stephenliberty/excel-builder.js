define(['underscore', './util'], function (_, util) {
    var StyleSheet = function (config) {
        this.id = _.uniqueId('StyleSheet');
        this.cellStyles = [{
            name:"Normal", 
            xfId:"0", 
            builtinId:"0"
        }];
        
        this.differentialStyles = [{}];
        this.masterCellFormats = [{
            numFmtId: 0, 
            fontId: 0, 
            fillId: 0, 
            borderId: 0, 
            xfid: 0
        }];
        this.masterCellStyles = [{
            numFmtId: 0, 
            fontId: 0, 
            fillId: 0, 
            borderId: 0
        }];
        this.fonts = [{}];
        this.numberFormatters = [];
        this.fills = [{}];
        this.borders = [{top: {},
                left: {},
                right: {},
                bottom: {},
                diagonal: {}}];
        
    };
    $.extend(true, StyleSheet.prototype, {
        createSimpleFormatter: function (type) {
            var sid = this.masterCellFormats.length;
            var style = {
                id: sid
            };
            switch(type) {
                case 'date':
                    style.numFmtId = 14;
                    break;
            }
            this.masterCellFormats.push(style);
            return style;
        },
		
        createNumberFormatter: function (formatInstructions) {
            var id = this.numberFormatters.length + 100;
            var format = {
                id: id,
                formatCode: formatInstructions
            }
            this.numberFormatters.push(format);
            return format;
        },
        
        /**
         * alignment: {
         *  horizontal: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_HorizontalAlignment.html,
         *  vertical: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_VerticalAlignment.html
         */
        createFormat: function (styleInstructions) {
            var sid = this.masterCellFormats.length;
            var style = {
                id: sid
            };
            if(styleInstructions.font && _.isObject(styleInstructions.font)) {
                style.fontId = this.createFontStyle(styleInstructions.font).id;
            } else if(styleInstructions.font) {
                if(_.isNaN(parseInt(styleInstructions.font, 10))) {
                    throw "Passing a non-numeric font id is not supported";
                }
                style.fontId = styleInstructions.font;
            }
			
            if (styleInstructions.format && _.isString(styleInstructions.format)) {
                style.numFmtId = this.createNumberFormatter(styleInstructions.format).id;
            } else if(styleInstructions.format) {
                if(_.isNaN(parseInt(styleInstructions.format))) {
                    throw "Invalid number formatter id";
                }
                style.numFmtId = styleInstructions.format;
            }
            
            if (styleInstructions.border && _.isObject(styleInstructions.border)) {
                style.borderId = this.createBorderFormatter(styleInstructions.border).id;
            } else if (styleInstructions.border) {
                if(_.isNaN(parseInt(styleInstructions.border))) {
                    throw "Passing a non-numeric border id is not supported";
                }
                style.borderId = styleInstructions.borderId;
            }
            
            if (styleInstructions.alignment && _.isObject(styleInstructions.alignment)) {
                style.alignment = _.pick(
                    styleInstructions.alignment,
                    'horizontal',
                    'justifyLastLine',
                    'readingOrder',
                    'relativeIndent',
                    'shrinkToFit',
                    'textRotation',
                    'vertical',
                    'wrapText'
                );
            }
            
            this.masterCellFormats.push(style);
            return style;
        },
	
        /**
         * All params optional
         * Expects: {
         * top: {},
         * left: {},
         * right: {},
         * bottom: {},
         * diagonal: {},
         * outline: boolean,
         * diagonalUp: boolean,
         * diagonalDown: boolean
         * }
         * Each border should follow:
         * {
         * style: styleString, http://www.schemacentral.com/sc/ooxml/t-ssml_ST_BorderStyle.html
         * color: ARBG color (requires the A, so for example FF006666)
         * }
         */
        createBorderFormatter: function (border) {
            _.defaults(border, {
                top: {},
                left: {},
                right: {},
                bottom: {},
                diagonal: {}
            });
            this.borders.push(border);
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
                id: fontId
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
            var data;
            var borderGenerator = function (name) {
                var b = doc.createElement(name);
                border.appendChild(b);
                if(data.left.style) {
                    b.setAttribute('style', data[name].style);
                }
                if(data.left.color) {
                    b.appendChild(this.exportColor(doc, data[name].color));
                }
                return b;
            }
            
            for(var i = 0, l = this.borders.length; i < l; i++) {
                var border = doc.createElement('border');
                data = this.borders[i];
				border.appendChild(borderGenerator('left'));
                border.appendChild(borderGenerator('right'));
                border.appendChild(borderGenerator('top'));
                border.appendChild(borderGenerator('bottom'));
                border.appendChild(borderGenerator('diagonal'));
				
                borders.appendChild(border);
            }
            return borders;
        },
	
        exportColor: function (doc, color) {
            var colorEl = doc.createElement('color');
            if(_.isString(color)) {
                colorEl.setAttribute('rgb', color);
                return colorEl;
            }
            
            if (!_.isUndefined(color.tint)) { 
                colorEl.setAttribute('tint', color.tint);
            }
            if (!_.isUndefined(color.auto)) { 
                colorEl.setAttribute('auto', !!color.auto);
            }
            if (!_.isUndefined(color.theme)) { 
                colorEl.setAttribute('theme', color.theme);
            }
            
            return colorEl;
        },
        
        exportMasterCellFormats: function (doc) {
            var cellFormats = util.createElement(doc, 'cellXfs', [
                ['count', this.masterCellFormats.length]
                ]);
            for(var i = 0, l = this.masterCellFormats.length; i < l; i++) {
                var mformat = this.masterCellFormats[i];
                cellFormats.appendChild(this.exportCellFormatElement(doc, mformat));
            }
            return cellFormats;
        },
		
        exportMasterCellStyles: function (doc) {
            var records = util.createElement(doc, 'cellStyleXfs', [
                ['count', this.masterCellStyles.length]
                ]);
            for(var i = 0, l = this.masterCellStyles.length; i < l; i++) {
                var mstyle = this.masterCellStyles[i];
                records.appendChild(this.exportCellFormatElement(doc, mstyle));
            }
            return records;
        },
	
        exportCellFormatElement: function (doc, styleInstructions) {
            var xf = doc.createElement('xf'), i = 0, l;
            var allowed = ['applyAlignment', 'applyBorder', 'applyFill', 'applyFont', 'applyNumberFormat', 
            'applyProtection', 'borderId', 'fillId', 'fontId', 'numFmtId', 'pivotButton', 'quotePrefix', 'xfId']
            var attributes = _.filter(_.keys(styleInstructions), function (key) {
                if(_.indexOf(allowed, key) != -1) {
                    return true;
                }
            });
			if(styleInstructions.alignment) {
				var alignment = doc.createElement('alignment');
				var keys = _.keys(styleInstructions.alignment);
				for(i = 0, l = keys.length; i < l; i++) {
					alignment.setAttribute(keys[i], styleInstructions.alignment[keys[i]]);
				}
				xf.appendChild(alignment);
			}
            var a = attributes.length;
            while(a--) {
                xf.setAttribute(attributes[a], styleInstructions[attributes[a]]);
            }
            return xf;
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
				
                if(fd.bold) {
                    font.appendChild(doc.createElement('b'));
                }
                if(fd.italic) {
                    font.appendChild(doc.createElement('i'));
                }
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
                if(fd.strike) {
                    font.appendChild(doc.createElement('strike'));
                }
                if(fd.shadow) {
                    font.appendChild(doc.createElement('shadow'));
                }
                if(fd.outline) {
                    font.appendChild(doc.createElement('outline'));
                }
                fonts.appendChild(font);
            }
            return fonts;
        },
		
        exportFills: function (doc) {
            var fills = util.createElement(doc, 'fills', [
                ['count', this.fills.length]
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
		
        exportNumberFormatters: function (doc) {
            var formatters = util.createElement(doc, 'numFmts', [
                ['count', this.numberFormatters.length]
                ]);
			
            for(var i = 0, l = this.numberFormatters.length; i < l; i++) {
                var fd = this.numberFormatters[i];
                var formatter = util.createElement(doc, 'numFmt', [
                    ['numFmtId', fd.id],
                    ['formatCode', fd.formatCode]
                ]);
                formatters.appendChild(formatter);
            }
			
            return formatters;
        },
		
        exportCellStyles: function (doc) {
            var cellStyles = doc.createElement('cellStyles');
            cellStyles.setAttribute('count', this.cellStyles.length);
			
            for(var i = 0, l = this.cellStyles.length; i < l; i++) {
                var style = this.cellStyles[i];
                delete style.id; //Remove internal id
                var record = util.createElement(doc, 'cellStyle');
                cellStyles.appendChild(record);
                var attributes = _.keys(style);
                var a = attributes.length;
                while(a--) {
                    record.setAttribute(attributes[a], style[attributes[a]]);
                }
            }
			
            return cellStyles;
        },
		
        exportDifferentialStyles: function (doc) {
            var dfxs = doc.createElement('dfxs');
            dfxs.setAttribute('count', this.differentialStyles.length);
			
            for(var i = 0, l = this.differentialStyles.length; i < l; i++) {
                var style = this.differentialStyles[i];
                delete style.id; //Remove internal id
                var record = util.createElement(doc, 'dfx');
                dfxs.appendChild(record);
                var attributes = _.keys(style);
                var a = attributes.length;
                while(a--) {
                    record.setAttribute(attributes[a], style[attributes[a]]);
                }
            }
			
            return dfxs;
        },
		
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'styleSheet');
            var styleSheet = doc.documentElement;
            styleSheet.appendChild(this.exportNumberFormatters(doc));
            styleSheet.appendChild(this.exportFonts(doc));
            styleSheet.appendChild(this.exportFills(doc));
            styleSheet.appendChild(this.exportBorders(doc));
            styleSheet.appendChild(this.exportMasterCellStyles(doc));
            styleSheet.appendChild(this.exportMasterCellFormats(doc));
            styleSheet.appendChild(this.exportCellStyles(doc));
            styleSheet.appendChild(this.exportDifferentialStyles(doc));
            return doc;
        }
    });
    return StyleSheet;
});