

onmessage = function(event) {
    if (!event.data || !event.data.ziplib) { return; }
    
    importScripts(event.data.ziplib);
    
    var zip = new JSZip();
    var files = event.data.files;
    for(var path in files) {
        var content = files[path];
        path = path.substr(1);
        zip.file(path, content, {base64: false});
    };
    postMessage({
        base64: !!event.data.base64
    });
    postMessage({
        status: 'done',
        data: zip.generate({
            base64: !!event.data.base64
        })
    });
};



