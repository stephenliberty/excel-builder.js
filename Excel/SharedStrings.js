/**
 * @module Excel/SharedStrings
 */
define(['underscore', './util'], function (_, util) {
    "use strict";
    var sharedStrings = function () {
        this.strings = {};
        this.stringArray = [];
        this.id = _.uniqueId('SharedStrings');
    };
    _.extend(sharedStrings.prototype, {
        /**
         * Adds a string to the shared string file, and returns the ID of the 
         * string which can be used to reference it in worksheets.
         * 
         * @param string {String}
         * @return int
         */
        addString: function (string) {
            this.strings[string] = this.stringArray.length;
            this.stringArray[this.stringArray.length] = string;
            return this.strings[string];
        },
        
        exportData: function () {
            return this.strings;
        },
        
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'sst');
            var sharedStringTable = doc.documentElement;
            this.stringArray.reverse();
            var l = this.stringArray.length;
            sharedStringTable.setAttribute('count', l);
            sharedStringTable.setAttribute('uniqueCount', l);
            
            var template = doc.createElement('si');
            var templateValue = doc.createElement('t');
            templateValue.appendChild(doc.createTextNode('--placeholder--'));
            template.appendChild(templateValue);
            var strings = this.stringArray;
            
            while (l--) {
                var clone = template.cloneNode(true);
                clone.firstChild.firstChild.nodeValue = strings[l];
                sharedStringTable.appendChild(clone);
            }
            
            return doc;
        }
    });
    return sharedStrings;
});