/**
 * @module Excel/RelationshipManager
 */
define(['underscore', './util', './Paths'], function (_, util, Paths) {
    "use strict";
    var RelationshipManager = function () {
        this.relations = {};
        this.lastId = 1;
    };
    
    _.uniqueId('rId'); //priming
    
    _.extend(RelationshipManager.prototype, {
        
        importData: function (data) {
            this.relations = data.relations;
            this.lastId = data.lastId;
        },
        exportData: function () {
            return {
                relations: this.relations,
                lastId: this.lastId
            };
        },
        
        addRelation: function (object, type) {
            this.relations[object.id] = {
                id: _.uniqueId('rId'),
                schema: util.schemas[type]
            };
            return this.relations[object.id].id;
        },
        
        getRelationshipId: function (object) {
            return this.relations[object.id] ? this.relations[object.id].id : null;
        },
		
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.relationshipPackage, 'Relationships');
            var relationships = doc.documentElement;
            
            _.each(this.relations, function (data, id) {
                var relationship = util.createElement(doc, 'Relationship', [
                    ['Id', data.id],
                    ['Type', data.schema],
                    ['Target', Paths[id]]
                ]);
                relationships.appendChild(relationship);
            });
            return doc;
        }
    });
    
    return RelationshipManager;
});