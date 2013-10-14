define([
    'require',
    'underscore',
    './Excel/Workbook',
    'JSZip'
], function (require, _, Workbook, JSZip) {
    
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
         * @param {Object} options
         * @param {Boolean} options.base64 Whether to 'return' the generated file as a base64 string
         * @param {Function} options.success The callback function to run after workbook creation is successful.
         * @param {Function} options.error The callback function to run if there is an error creating the workbook.
         * @param {String} options.requireJsPath (Optional) The path to requirejs. Will use the id 'requirejs' to look up the script if not specified.
         */
        createFileAsync: function (workbook, options) {
            
            
            workbook.generateFilesAsync({
                success: function (files) {
                    
                    var worker = new Worker(require.toUrl('./Excel/ZipWorker.js'));
                    worker.addEventListener('message', function(event, data) {
                        if(event.data.status == 'done') {
                            options.success(event.data.data);
                        }
                    });
                    worker.postMessage({
                        files: files,
                        ziplib: require.toUrl('JSZip'),
                        base64: options.base64
                    });
                },
                error: function () {
                    options.error();
                }
            });
        },
        
        /**
         * Turns a workbook into a downloadable file.
         * @param {Excel/Workbook} workbook The workbook that is being converted
         * @param {Object} options - options to modify how the excel doc is created. Only accepts a base64 boolean at the moment.
         */
        createFile: function (workbook, options) {
            var zip = new JSZip();
            var files = workbook.generateFiles();
            _.each(files, function (content, path) {
                path = path.substr(1);
                zip.file(path, content, {base64: false});
            })
            return zip.generate({
                base64: (!options || !options.base64)
            });
        }
    }
    
    
    return Factory;
});