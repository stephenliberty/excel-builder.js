/**
 * @module Excel/StyleSheet
 */
define(['underscore', './util'], function (_, util) {
    "use strict";
    var StyleSheet = function () {
        this.id = _.uniqueId('StyleSheet');
        this.cellStyles = [{
            name:"Normal", 
            xfId:"0", 
            builtinId:"0"
        }];
        this.defaultTableStyle = false;
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
        this.fills = [{}, {
            type: 'pattern', 
            patternType: 'gray125', 
            fgColor: 'FF333333', 
            bgColor: 'FF333333'
        }];
        this.borders = [{
            top: {},
            left: {},
            right: {},
            bottom: {},
            diagonal: {}
        }];
        this.tableStyles = [];
    };
    _.extend(StyleSheet.prototype, {
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

        createFill: function (fillInstructions) {
            var id = this.fills.length;
            var fill = fillInstructions;
            fill.id = id;
            this.fills.push(fill);
            return fill;
        },

        createNumberFormatter: function (formatInstructions) {
            var id = this.numberFormatters.length + 100;
            var format = {
                id: id,
                formatCode: formatInstructions
            };
            this.numberFormatters.push(format);
            return format;
        },

        /**
        * alignment: {
        *  horizontal: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_HorizontalAlignment.html
        *  vertical: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_VerticalAlignment.html
        *  @param {Object} styleInstructions
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
                if(_.isNaN(parseInt(styleInstructions.format, 10))) {
                    throw "Invalid number formatter id";
                }
                style.numFmtId = styleInstructions.format;
            }

            if (styleInstructions.border && _.isObject(styleInstructions.border)) {
                style.borderId = this.createBorderFormatter(styleInstructions.border).id;
            } else if (styleInstructions.border) {
                if(_.isNaN(parseInt(styleInstructions.border, 10))) {
                    throw "Passing a non-numeric border id is not supported";
                }
                style.borderId = styleInstructions.border;
            }

            if (styleInstructions.fill && _.isObject(styleInstructions.fill)) {
                style.fillId = this.createFill(styleInstructions.fill).id;
            } else if (styleInstructions.fill) {
                if(_.isNaN(parseInt(styleInstructions.fill, 10))) {
                    throw "Passing a non-numeric fill id is not supported";
                }
                style.fillId = styleInstructions.fill;
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
        
        createDifferentialStyle: function (styleInstructions) {
            var id = this.differentialStyles.length;
            var style = {
                id: id
            };
            if(styleInstructions.font && _.isObject(styleInstructions.font)) {
                style.font = styleInstructions.font;
            }
            if (styleInstructions.border && _.isObject(styleInstructions.border)) {
                style.border = _.defaults(styleInstructions.border, {
                    top: {},
                    left: {},
                    right: {},
                    bottom: {},
                    diagonal: {}
		});
            }
            if (styleInstructions.fill && _.isObject(styleInstructions.fill)) {
                style.fill = styleInstructions.fill;
            }
            if (styleInstructions.alignment && _.isObject(styleInstructions.alignment)) {
                style.alignment = styleInstructions.alignment;
            }
            if (styleInstructions.format && _.isString(styleInstructions.format)) {
                style.numFmt = styleInstructions.format;
            }
            this.differentialStyles[id] = style;
            return style;
        },
        
        /**
         * Should be an object containing keys that match with one of the keys from this list:
         * http://www.schemacentral.com/sc/ooxml/t-ssml_ST_TableStyleType.html
         * 
         * The value should be a reference to a differential format (dxf)
         * @param {Object} instructions
         */
        createTableStyle: function (instructions) {
            this.tableStyles.push(instructions);
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
        * @param {Object} border
        */
        createBorderFormatter: function (border) {
            _.defaults(border, {
                top: {},
                left: {},
                right: {},
                bottom: {},
                diagonal: {},
                id: this.borders.length
            });
            this.borders.push(border);
            return border;
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
        * @param {Object} instructions
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
                    ], instructions.underline) !== -1) {
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
                fontStyle.color = instructions.color;
            }
            if(instructions.fontName) {
                fontStyle.fontName = instructions.fontName;
            }
            this.fonts.push(fontStyle);
            return fontStyle;
        },

        exportBorders: function (doc) {
            var borders = doc.createElement('borders');
            borders.setAttribute('count', this.borders.length);
            
            for(var i = 0, l = this.borders.length; i < l; i++) {
                borders.appendChild(this.exportBorder(doc, this.borders[i]));
            }
            return borders;
        },

        exportBorder: function (doc, data) {
            var border = doc.createElement('border');
            var self = this;
            var borderGenerator = function (name) {
                var b = doc.createElement(name);
                if(data[name].style) {
                    b.setAttribute('style', data[name].style);
                }
                if(data[name].color) {
                    b.appendChild(self.exportColor(doc, data[name].color));
                }
                return b;
            };
            border.appendChild(borderGenerator('left'));
            border.appendChild(borderGenerator('right'));
            border.appendChild(borderGenerator('top'));
            border.appendChild(borderGenerator('bottom'));
            border.appendChild(borderGenerator('diagonal'));
            return border;
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
            var xf = doc.createElement('xf');
            var allowed = ['applyAlignment', 'applyBorder', 'applyFill', 'applyFont', 'applyNumberFormat', 
            'applyProtection', 'borderId', 'fillId', 'fontId', 'numFmtId', 'pivotButton', 'quotePrefix', 'xfId'];
            var attributes = _.filter(_.keys(styleInstructions), function (key) {
                if(_.indexOf(allowed, key) !== -1) {
                    return true;
                }
            });
            if(styleInstructions.alignment) {
                var alignmentData = styleInstructions.alignment;
                xf.appendChild(this.exportAlignment(doc, alignmentData));
            }
            var a = attributes.length;
            while(a--) {
                xf.setAttribute(attributes[a], styleInstructions[attributes[a]]);
            }
            if(styleInstructions.fillId) {
                xf.setAttribute('applyFill', '1');
            }
            return xf;
        },
        
        exportAlignment: function (doc, alignmentData) {
            var alignment = doc.createElement('alignment');
            var keys = _.keys(alignmentData);
            for(var i = 0, l = keys.length; i < l; i++) {
                alignment.setAttribute(keys[i], alignmentData[keys[i]]);
            }
            return alignment;
        },
        
        exportFonts: function (doc) {
            var fonts = doc.createElement('fonts');
            fonts.setAttribute('count', this.fonts.length);
            for(var i = 0, l = this.fonts.length; i < l; i++) {
                var fd = this.fonts[i];
                fonts.appendChild(this.exportFont(doc, fd));
            }
            return fonts;
        },
        
        exportFont: function (doc, fd) {
            var font = doc.createElement('font');
            if(fd.size) {
                var size = doc.createElement('sz');
                size.setAttribute('val', fd.size);
                font.appendChild(size);
            }

            if(fd.fontName) {
                var fontName = doc.createElement('name');
                fontName.setAttribute('val', fd.fontName);
                font.appendChild(fontName);
            }

            if(fd.bold) {
                font.appendChild(doc.createElement('b'));
            }
            if(fd.italic) {
                font.appendChild(doc.createElement('i'));
            }
            if(fd.vertAlign) {
                var vertAlign = doc.createElement('vertAlign');
                vertAlign.setAttribute('val', fd.vertAlign);
                font.appendChild(vertAlign);
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
            if(fd.color) {
                font.appendChild(this.exportColor(doc, fd.color));
            }
            return font;
        },

        exportFills: function (doc) {
            var fills = doc.createElement('fills');
            fills.setAttribute('count', this.fills.length);
            for(var i = 0, l = this.fills.length; i < l; i++) {
                var fd = this.fills[i];
                fills.appendChild(this.exportFill(doc, fd));
            }
            return fills;
        },
        
        exportFill: function (doc, fd) {
            var fillDef;
            var fill = doc.createElement('fill');
            if (fd.type === 'pattern') {
                fillDef = this.exportPatternFill(doc, fd);
                fill.appendChild(fillDef);
            } else if (fd.type === 'gradient') {
                fillDef = this.exportGradientFill(doc, fd);
                fill.appendChild(fillDef);
            }
            return fill;
        },
        
        exportGradientFill: function (doc, data) {
            var fillDef = doc.createElement('gradientFill');
            if(data.degree) {
                fillDef.setAttribute('degree', data.degree);
            } else if (data.left) {
                fillDef.setAttribute('left', data.left);
                fillDef.setAttribute('right', data.right);
                fillDef.setAttribute('top', data.top);
                fillDef.setAttribute('bottom', data.bottom);
            }
            var start = doc.createElement('stop');
            start.setAttribute('position', data.start.pureAt || 0);
            var startColor = doc.createElement('color');
            if (typeof data.start === 'string' || data.start.color) {
                startColor.setAttribute('rgb', data.start.color || data.start);
            } else if (typeof data.start.theme) {
                startColor.setAttribute('theme', data.start.theme);
            }
            
            var end = doc.createElement('stop');
            var endColor = doc.createElement('color');
            end.setAttribute('position', data.end.pureAt || 1);
            if (typeof data.start === 'string' || data.end.color) {
                endColor.setAttribute('rgb', data.end.color || data.end);
            } else if (typeof data.end.theme) {
                endColor.setAttribute('theme', data.end.theme);
            }
            start.appendChild(startColor);
            end.appendChild(endColor);
            fillDef.appendChild(start);
            fillDef.appendChild(end);
            return fillDef;
        },
        
        /**
        * Pattern types: http://www.schemacentral.com/sc/ooxml/t-ssml_ST_PatternType.html
        * @param {XMLDoc} doc
        * @param {Object} data
        */
        exportPatternFill: function (doc, data) {
            var fillDef = util.createElement(doc, 'patternFill', [
                ['patternType', data.patternType]
                ]);
            if(!data.bgColor) {
                data.bgColor = 'FFFFFFFF';
            }
            if(!data.fgColor) {
                data.fgColor = 'FFFFFFFF';
            }

            var bgColor = doc.createElement('bgColor');
            if(_.isString(data.bgColor)) {
                bgColor.setAttribute('rgb', data.bgColor);
            } else {
                if(data.bgColor.theme) {
                    bgColor.setAttribute('theme', data.bgColor.theme);
                } else {
                    bgColor.setAttribute('rgb', data.bgColor.rbg);
                }
            }

            var fgColor = doc.createElement('fgColor');
            if(_.isString(data.fgColor)) {
                fgColor.setAttribute('rgb', data.fgColor);
            } else {
                if(data.fgColor.theme) {
                    fgColor.setAttribute('theme', data.fgColor.theme);
                } else {
                    fgColor.setAttribute('rgb', data.fgColor.rbg);
                }
            }
            fillDef.appendChild(fgColor);
            fillDef.appendChild(bgColor);
            return fillDef;
        },

        exportNumberFormatters: function (doc) {
            var formatters = doc.createElement('numFmts');
            formatters.setAttribute('count', this.numberFormatters.length);
            for(var i = 0, l = this.numberFormatters.length; i < l; i++) {
                var fd = this.numberFormatters[i];
                formatters.appendChild(this.exportNumberFormatter(doc, fd));
            }
            return formatters;
        },
        
        exportNumberFormatter: function (doc, fd) {
            var numFmt = doc.createElement('numFmt');
            numFmt.setAttribute('numFmtId', fd.id);
            numFmt.setAttribute('formatCode', fd.formatCode);
            return numFmt;
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
            var dxfs = doc.createElement('dxfs');
            dxfs.setAttribute('count', this.differentialStyles.length);

            for(var i = 0, l = this.differentialStyles.length; i < l; i++) {
                var style = this.differentialStyles[i];
                dxfs.appendChild(this.exportDFX(doc, style));
            }

            return dxfs;
        },
        
        exportDFX: function (doc, style) {
            var dxf = doc.createElement('dxf');
            if(style.font) {
                dxf.appendChild(this.exportFont(doc, style.font));
            }
            if(style.fill) {
                dxf.appendChild(this.exportFill(doc, style.fill));
            }
	    if(style.border) {
                dxf.appendChild(this.exportBorder(doc, style.border));
            }
            if(style.numFmt) {
                dxf.appendChild(this.exportNumberFormatter(doc, style.numFmt));
            }
            if(style.alignment) {
                dxf.appendChild(this.exportAlignment(doc, style.alignment));
            }
            return dxf;
        },
        
        exportTableStyles: function (doc) {
            var tableStyles = doc.createElement('tableStyles');
            tableStyles.setAttribute('count', this.tableStyles.length);
            if(this.defaultTableStyle) {
                tableStyles.setAttribute('defaultTableStyle', this.defaultTableStyle);
            }
            for(var i = 0, l = this.tableStyles.length; i < l; i++) {
                tableStyles.appendChild(this.exportTableStyle(doc, this.tableStyles[i]));
            }
            return tableStyles;
        },
        
        exportTableStyle: function (doc, style) {
            var tableStyle = doc.createElement('tableStyle');
            tableStyle.setAttribute('name', style.name);
            tableStyle.setAttribute('pivot', 0);
            var i = 0;
            
            _.each(style, function (value, key) {
                if(key === 'name') {return;}
                i++;
                var styleEl = doc.createElement('tableStyleElement');
                styleEl.setAttribute('type', key);
                styleEl.setAttribute('dxfId', value);
                tableStyle.appendChild(styleEl);
            });
            tableStyle.setAttribute('count', i);
            return tableStyle;
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
            if(this.tableStyles.length) {
                styleSheet.appendChild(this.exportTableStyles(doc));
            }
            return doc;
        }
    });
    return StyleSheet;
});
