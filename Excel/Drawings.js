/**
 * @module Excel/Drawings
 */
define(['underscore', './RelationshipManager', './util'], function (_, RelationshipManager, util) {
    "use strict";
    var Drawings = function () {
        this.drawings = [];
        this.relations = new RelationshipManager();
        this.id = _.uniqueId('Drawings');
    };
    
    _.extend(Drawings.prototype, {
        /**
         * Adds a drawing (more likely a subclass of a Drawing) to the 'Drawings' for a particular worksheet.
         * 
         * @param {Drawing} drawing
         * @returns {undefined}
         */
        addDrawing: function (drawing) {
            this.drawings.push(drawing);
        },
        getCount: function () {
            return this.drawings.length;
        },
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetDrawing, 'xdr:wsDr');
            var drawings = doc.documentElement;
            drawings.setAttribute('xmlns:xdr', util.schemas.spreadsheetDrawing);
            drawings.setAttribute('xmlns:a', util.schemas.drawing);
            
            for(var i = 0, l = this.drawings.length; i < l; i++) {
                
                var rId = this.relations.getRelationshipId(this.drawings[i].getMediaData());
                if(!rId) {
                    rId = this.relations.addRelation(this.drawings[i].getMediaData(), this.drawings[i].getMediaType()); //chart
                }
                this.drawings[i].setRelationshipId(rId);
                drawings.appendChild(this.drawings[i].toXML(doc));
            }
            return doc;
        }
    });
    
    return Drawings;
});