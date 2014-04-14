define(['underscore', '../util'], function (_, util) {
    "use strict";
    /**
     * 
     * @param {Object} config
     * @param {Number} config.x The cell column number that the top left of the picture will start in
     * @param {Number} config.y The cell row number that the top left of the picture will start in
     * @param {Number} config.width Width in EMU's
     * @param {Number} config.height Height in EMU's
     * @constructor
     */
    var OneCellAnchor = function (config) {
        this.x = null;
        this.y = null;
        this.xOff = null;
        this.yOff = null;
        this.width = null;
        this.height = null;
        if(config) {
            this.setPos(config.x, config.y, config.xOff, config.yOff);
            this.setDimensions(config.width, config.height);
        }
    };
    _.extend(OneCellAnchor.prototype, {
        setPos: function (x, y, xOff, yOff) {
            this.x = x;
            this.y = y;
            if(xOff !== undefined) {
                this.xOff = xOff;
            }
            if(yOff !== undefined) {
                this.yOff = yOff;
            }
        },
        setDimensions: function (width, height) {
            this.width = width;
            this.height = height;
        },
        toXML: function (xmlDoc, content) {
            var root = util.createElement(xmlDoc, 'xdr:oneCellAnchor');
            var from = util.createElement(xmlDoc, 'xdr:from');
            var fromCol = util.createElement(xmlDoc, 'xdr:col');
            fromCol.appendChild(xmlDoc.createTextNode(this.x));
            var fromColOff = util.createElement(xmlDoc, 'xdr:colOff');
            fromColOff.appendChild(xmlDoc.createTextNode(this.xOff || 0));
            var fromRow = util.createElement(xmlDoc, 'xdr:row');
            fromRow.appendChild(xmlDoc.createTextNode(this.y));
            var fromRowOff = util.createElement(xmlDoc, 'xdr:rowOff');
            fromRowOff.appendChild(xmlDoc.createTextNode(this.yOff || 0));
            from.appendChild(fromCol);
            from.appendChild(fromColOff);
            from.appendChild(fromRow);
            from.appendChild(fromRowOff);
            
            root.appendChild(from);
            
            var dimensions = util.createElement(xmlDoc, 'xdr:ext');
            dimensions.setAttribute('cx', this.width);
            dimensions.setAttribute('cy', this.height);
            root.appendChild(dimensions);
            
            root.appendChild(content);
            
            root.appendChild(util.createElement(xmlDoc, 'xdr:clientData'));
            return root;
        }
    });
    return OneCellAnchor;
});