define(['underscore', './util', './Paths'], function (_, util, Paths) {
    var RelationshipManager = function () {
        
    };
    
    _.uniqueId('rId'); //priming
    
    _.extend(RelationshipManager.prototype, {
        
        relations: {},
        
        addRelation: function (object, type) {
            this.relations[object.id] = {
                id: _.uniqueId('rId'),
                schema: util.schemas[type]
            }
        },
        
        getRelationshipId: function (object) {
            return this.relations[object.id].id
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
})