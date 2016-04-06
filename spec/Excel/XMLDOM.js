describe("basic DOM simulator for web workers", function() {
    var XMLDOM = ExcelBuilder.XMLDOM;

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

            var foo = d.createElement('foo');
            foo.setAttribute("france", "silly");
            foo.setAttribute("britain", "port");
            var bar = d.createElement('bar');
            bar.setAttribute("georgia", "peaches");
            var baz = d.createElement('baz');
            foo.appendChild(bar);
            d.documentElement.appendChild(foo);
            d.documentElement.appendChild(baz);

            expect(d.toString()).toEqual('<arbitraryNodeName xmlns="arbitraryNS"><foo france="silly" britain="port"><bar georgia="peaches"/></foo><baz/></arbitraryNodeName>');
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

