var requireConfig;
var worksheet;
console = {
    log: postMessage
};
start = function(data) {
    require(['Worksheet'], function(Worksheet) {
        worksheet = new Worksheet();
        worksheet.importData(data);
        postMessage({status: 'sharedStrings', data: worksheet.collectSharedStrings()});
        
    });
};

onmessage = function(event) {
    var data = event.data;
    if (typeof data == 'object') {
        switch (data.instruction) {
            case "setup":
                requireConfig = data.config;
                importScripts(data.requireJsPath);
                require.config(requireConfig);
                postMessage({status: "ready"});
                break;
            case "start": 
                start(data.data);
                break;
            case "export":
                worksheet.setSharedStringCollection({
                    strings: data.sharedStrings
                });
                postMessage({status: "finished", data: worksheet.toXML().toString()});
                break;
        }
    }
};



