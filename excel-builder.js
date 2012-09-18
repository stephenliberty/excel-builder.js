define([
    'underscore',
    './Excel/Workbook',
    'JSZip'
], function (_, Workbook, JSZip) {
    
    /**
     * @name Excel
     * @public
     * @author Stephen Liberty
     * @requires underscore
     * @requires Excel/Workbook
     * @requires JSZIP
     * @exports excel-builder
     */
    var Factory = {
        /**
         * Creates a new workbook.
         */
        createWorkbook: function () {
            return new Workbook();
        },
        
        /**
         * Turns a workbook into a downloadable file.
         * @param {Excel/Workbook} workbook The workbook that is being converted
         * @param {Object} options - options to modify how the excel doc is created. Only accepts a base64 boolean at the moment.
         */
        createFile: function (workbook, options) {
            var zip = new JSZip();
            var files = workbook.generateFiles();
            var folders = {
                "": zip
            };
            _.each(files, function (content, path) {
                
                path = path.substr(1);
                zip.file(path, content, {base64: false});
//                var folder = path.match(/([\w\d\/]+)\/[^\/]+/)
//                console.log(path, folder)
//                if(folder && !folders[folder]) {
//                    folders[folder] = zip.folder(folder);
//                } else {
//                    folder = ""
//                }
//                var f = folders[folder];
//                console.log(f)
//                f.add(path, content, {base64: false, binary: false});
            })
            return zip.generate({
                base64: (!options || !options.base64)
            });
        }
    }
    
    
    return Factory;
});