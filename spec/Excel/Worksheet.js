describe('Excel/Worksheet', function () {
    var Worksheet = ExcelBuilder.Worksheet;
    describe('compilePageDetailPiece', function () {
        it("will give back the appropriate string for an instruction object", function() {
            var io = {text: "Hello there"};
            var text = Worksheet.prototype.compilePageDetailPiece(io);
            var expected = '&"-,Regular"Hello there';
            expect(text).toEqual(expected);
        });

        it("will give back a string with underline instructions when an instruction object has underline set", function() {
            var io = {text: "Hello there", underline: true};
            var text = Worksheet.prototype.compilePageDetailPiece(io);
            var expected = '&"-,Regular"&UHello there';
            expect(text).toEqual(expected);
        });

        it("will give back a string with bold instructions when an instruction object has bold set", function() {
            var io = {text: "Hello there", bold: true};
            var text = Worksheet.prototype.compilePageDetailPiece(io);
            var expected = '&"-,Bold"Hello there';
            expect(text).toEqual(expected);
        });

        it("will give back a string with font instructions when an instruction object has a font set", function() {
            var io = {text: "Hello there", font: 'Arial'};
            var text = Worksheet.prototype.compilePageDetailPiece(io);
            var expected = '&"Arial,Regular"Hello there';
            expect(text).toEqual(expected);
        });

        it("will build each piece of an array of instructions and return the end result", function() {
            var io = [{text: "Hello there", font: 'Arial'}, " - on ", {text: "5/7/9", underline: true}];
            var text = Worksheet.prototype.compilePageDetailPiece(io);
            var expected = '&"Arial,Regular"Hello there&"-,Regular" - on &"-,Regular"&U5/7/9';
            expect(text).toEqual(expected);
        });
    });
});