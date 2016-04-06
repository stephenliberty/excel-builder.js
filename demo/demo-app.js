
var express = require('express');
var app = express();
var ExcelBuilder = require('../src');

app.get('/', function (req, res) {
    res.send('<a href="/demo">Download node generated demo doc</a>');
});

app.get('/demo', function (req, res) {
    var data = require('./testdata.json');
    var stuff = [];
    for(var i = 0, l = data.length; i < l; i++) {
        var d = data[i];
        stuff[i] = [
            d.id,
            d.name,
            d.price,
            d.location,
            d.startDate,
            d.endDate
        ];
    }

    stuff = ([{value: '', metadata: {}}]).concat(stuff)

    var basicReport = new ExcelBuilder.Template.BasicReport();
    var columns = [
        {id: 'id', name: "ID", type: 'number', width: 20},
        {id: 'name', name:"Name", type: 'string', width: 50},
        {id: 'price', name: "Price", type: 'number', style: basicReport.predefinedFormatters.currency.id},
        {id: 'location', name: "Location", type: 'string'},
        {id: 'startDate', name: "Start Date", type: 'date', style: basicReport.predefinedFormatters.date.id, width: 15},
        {id: 'endDate', name: "End Date", type: 'date', style: basicReport.predefinedFormatters.date.id, width: 15}
    ];

    var worksheetData = [
        [
            {value: "ID", metadata: {style: basicReport.predefinedFormatters.header.id, type: 'string'}},
            {value: "Name", metadata: {style: basicReport.predefinedFormatters.header.id, type: 'string'}},
            {value: "Price", metadata: {style: basicReport.predefinedFormatters.header.id, type: 'string'}},
            {value: "Location", metadata: {style: basicReport.predefinedFormatters.header.id, type: 'string'}},
            {value: "Start Date", metadata: {style: basicReport.predefinedFormatters.header.id, type: 'string'}},
            {value: "End Date", metadata: {style: basicReport.predefinedFormatters.header.id, type: 'string'}}
        ]
    ].concat(data);

    basicReport.setHeader([
        {bold: true, text: "Generic Report"}, "", ""
    ]);
    basicReport.setData(worksheetData);
    basicReport.setColumns(columns);
    basicReport.setFooter([
        '', '', 'Page &P of &N'
    ]);

    var worksheet = basicReport.getWorksheet();

    worksheet.hyperlinks.push({
        cell: 'B2',
        tooltip: 'Click me!',
        location: 'http://www.google.com',
        display: 'Go to google'
    })

    var sheetView = new ExcelBuilder.SheetView;
    sheetView.rightToLeft = true;
    worksheet.sheetView = sheetView;

    ExcelBuilder.Builder.createFile(basicReport.prepare(), {
        type: 'uint8array'
    }).then(function (data) {
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="demo.xlsx"'
        });
        res.send(new Buffer(data));
    }).catch(function (e) {
        console.error(e);
        res.status(500);
        res.send(e);
    });
})

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
