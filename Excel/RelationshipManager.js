define(['underscore', './util', './Paths'], function (_, util, Paths) {
    var RelationshipManager = function () {
        this.relations = {};
		this.lastId = 1;
    };
    
    _.uniqueId('rId'); //priming
    
    $.extend(true, RelationshipManager.prototype, {
        
        addRelation: function (object, type) {
            this.relations[object.id] = {
                id: 'rId' + this.lastId++,
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