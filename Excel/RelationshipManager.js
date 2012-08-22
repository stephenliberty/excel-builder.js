define(['underscore', './util'], function (_, util) {
    var RelationshipManager = function () {
        
    };
    
    _.uniqueId('rId'); //priming
    
    _.extend(RelationshipManager.prototype, {
        
        relations: {},
        
        addRelation: function (path, type) {
            this.relations[path] = {
                id: _.uniqueId('rId'),
                schema: util.schemas[type]
            }
        },
        
        getRelationshipId: function (path) {
            return this.relations[path].id
        },
        
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.relationshipPackage, 'Relationships');
            var relationships = doc.documentElement;
            
            _.each(this.relations, function (data, path) {
                var relationship = util.createElement(doc, 'Relationship', [
                    ['Id', data.id],
                    ['Type', data.schema],
                    ['Target', path]
                ]);
                relationships.appendChild(relationship);
            });
            return doc;
        }
    });
    
    return RelationshipManager;
})