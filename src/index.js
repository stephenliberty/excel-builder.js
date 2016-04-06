var _ = require('lodash');
var EBExport = module.exports = {
    Drawings: require('./Excel/Drawings'),
    Drawing: require('./Excel/Drawing/index'),
    Pane: require('./Excel/Pane'),
    Paths: require('./Excel/Paths'),
    Positioning: require('./Excel/Positioning'),
    RelationshipManager: require('./Excel/RelationshipManager'),
    SharedStrings: require('./Excel/SharedStrings'),
    SheetProtection: require('./Excel/SheetProtection'),
    SheetView: require('./Excel/SheetView'),
    StyleSheet: require('./Excel/StyleSheet'),
    Table: require('./Excel/Table'),
    util: require('./Excel/util'),
    Workbook: require('./Excel/Workbook'),
    Worksheet: require('./Excel/Worksheet'),
    WorksheetExportWorker: require('./Excel/WorksheetExportWorker'),
    XMLDOM: require('./Excel/XMLDOM'),
    ZipWorker: require('./Excel/ZipWorker'),
    Builder: require('./excel-builder'),
    Template: require('./Template')
};

try {
    if(typeof window !== 'undefined!') {
        window.ExcelBuilder = EBExport;
    }
} catch (e) {
    //Silently ignore?
    console.info("Not attaching EB to window");
}