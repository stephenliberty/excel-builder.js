define(['Excel/util'], function(util) {
    describe("utility functions", function() {
        describe("compilePageDetailPiece", function() {
            it("will give back the appropriate string for an instruction object", function() {
                var io = {text: "Hello there"};
                var text = util.compilePageDetailPiece(io);
                var expected = '&"-,Regular"Hello there';
                expect(text).toEqual(expected);
            });

            it("will give back a string with underline instructions when an instruction object has underline set", function() {
                var io = {text: "Hello there", underline: true};
                var text = util.compilePageDetailPiece(io);
                var expected = '&"-,Regular"&UHello there';
                expect(text).toEqual(expected);
            });

            it("will give back a string with bold instructions when an instruction object has bold set", function() {
                var io = {text: "Hello there", bold: true};
                var text = util.compilePageDetailPiece(io);
                var expected = '&"-,Bold"Hello there';
                expect(text).toEqual(expected);
            });

            it("will give back a string with font instructions when an instruction object has a font set", function() {
                var io = {text: "Hello there", font: 'Arial'};
                var text = util.compilePageDetailPiece(io);
                var expected = '&"Arial,Regular"Hello there';
                expect(text).toEqual(expected);
            });

            it("will build each piece of an array of instructions and return the end result", function() {
                var io = [{text: "Hello there", font: 'Arial'}, " - on ", {text: "5/7/9", underline: true}];
                var text = util.compilePageDetailPiece(io);
                var expected = '&"Arial,Regular"Hello there&"-,Regular" - on &"-,Regular"&U5/7/9';
                expect(text).toEqual(expected);
            });
        });
        describe("positionToLetterRef", function() {
            it("will give back the appropriate excel cell coordinate on an x/y position", function() {
                expect(util.positionToLetterRef(1,1)).toEqual('A1');
                expect(util.positionToLetterRef(5,50)).toEqual('E50');
                expect(util.positionToLetterRef(50,50)).toEqual('AX50');
            });
        });
    });
});