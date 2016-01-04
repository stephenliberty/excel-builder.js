
    describe("utility functions", function() {
        var util = ExcelBuilder.util;
        describe("positionToLetterRef", function() {
            it("will give back the appropriate excel cell coordinate on an x/y position", function() {
                expect(util.positionToLetterRef(1,1)).toEqual('A1');
                expect(util.positionToLetterRef(5,50)).toEqual('E50');
                expect(util.positionToLetterRef(50,50)).toEqual('AX50');
            });
        });
    });
