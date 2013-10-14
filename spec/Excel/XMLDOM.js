define(['Excel/XMLDOM'], function(XMLDOM) {
    describe("basic DOM simulator for web workers", function() {
        
        describe("XMLDOM", function() {
            var nodeName = "arbitraryNodeName";
            var ns = "arbitraryNS";
            it("has a documentElement", function () {
                var d = new XMLDOM(ns, nodeName);
                expect(d.documentElement).toBeTruthy();
            });
            
            it("will have a properly named root node", function () {
                var d = new XMLDOM(ns, nodeName);
                expect(d.documentElement.nodeName).toEqual(nodeName);
            });
            
            it("will have the correct namespace", function () {
                var d = new XMLDOM(ns, nodeName);
                expect(d.documentElement.xmlns).toEqual(ns);
            });
            
            it("will have the appropriate content", function () {
                var d = new XMLDOM(ns, nodeName);
                console.log(d);
                var foo = d.createElement('foo');
                foo.setAttribute("france", "silly");
                foo.setAttribute("britain", "port");
                var bar = d.createElement('bar');
                bar.setAttribute("georgia", "peaches");
                var baz = d.createElement('baz');
                foo.appendChild(bar);
                d.documentElement.appendChild(foo);
                d.documentElement.appendChild(baz);
                
                console.log(d.toXmlString());
            });
            
        });
        
        describe("XMLDOM.XMLNode", function() {
            var nodeName = "arbitraryNodeName";
            var ns = "arbitraryNS";
            
            it("will clone properly", function () {
                var d = new XMLDOM(ns, nodeName);
                var foo = d.createElement('foo');
                var bar = d.createElement('bar');
                
                foo.appendChild(bar);
                
                var baz = foo.cloneNode(true);
                bar.setAttribute('joy', true);
                
                expect(baz.joy).toEqual(undefined);
            });
            
        });
        
        
        
    });
    
});