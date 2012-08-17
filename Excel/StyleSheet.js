define(['underscore', './util'], function (_, util) {
    var StyleSheet = function (config) {
        
    };
    _.extend(StyleSheet.prototype, {
        cellStyles: [
            {numFmtId: 0}
        ],
        
        borders: [
            {}
        ],
        
        createBasicCellStyle: function (type) {
            var sid = this.cellStyles.length + 1;
            var style = {
                sid: sid
            };
            switch(type) {
                case 'date':
                    style.numFmtId = 14;
                    break;
            }
            this.cellStyles.push(style);
            return style;
        },
        
        toXML: function () {
            var styles = this.cellStyles;
            
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'styleSheet');
            var styleSheet = doc.documentElement;
            styleSheet.setAttribute('xmlns:mc', "http://schemas.openxmlformats.org/markup-compatibility/2006");
            styleSheet.setAttribute('xmlns:x14ac', "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac");
            styleSheet.setAttribute('mc:Ignorable', "x14ac");
            
            var borders = util.createElement(doc, 'borders', [
                ['count', this.borders.length]
            ]);
            
            for(var i = 0, l = this.borders.length; i < l; i++) {
                var border = doc.createElement('border');
                border.appendChild(doc.createElement('left'));
                border.appendChild(doc.createElement('right'));
                border.appendChild(doc.createElement('top'));
                border.appendChild(doc.createElement('bottom'));
                border.appendChild(doc.createElement('diagonal'));
                borders.appendChild(border);
            }
            
            styleSheet.appendChild(borders);
            
            var cellXfs = util.createElement(doc, 'cellXfs', [
                ['count', styles.length]
            ]);
            for(var i = 0, l = styles.length; i < l; i++) {
                var style = styles[i];
                var xf = util.createElement(doc, 'xf');
                
                if(style.numFmtId >= 0) {
                    xf.setAttribute('numFmtId', style.numFmtId);
                }
                if(style.borderId) {
                    xf.setAttribute('borderId', style.borderId);
                }
                cellXfs.appendChild(xf);
            }
            styleSheet.appendChild(cellXfs);
            return doc;
        }
    });
    return StyleSheet;
});