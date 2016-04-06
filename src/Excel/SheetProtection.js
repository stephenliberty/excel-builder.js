"use strict";

/**
 * @module Excel/SheetProtection
 *
 * https://msdn.microsoft.com/en-us/library/documentformat.openxml.spreadsheet.pane%28v=office.14%29.aspx
 */
var _ = require('lodash');
var util = require('./util');

var SheetProtection = function () {
    this.algorithmName = null;
    this.autoFilter = null;
    this.deleteColumns = null;
    this.deleteRows = null;
    this.formatCells = null;
    this.formatColumns = null;
    this.formatRows = null;
    this.unhashedValue = null;
    this.hashValue = null;
    this.insertColumns = null;
    this.insertHyperlinks = null;
    this.insertRows = null;
    this.objects = null;
    this.pivotTables = null;
    this.saltValue = null;
    this.scenarios = null;
    this.selectLockedCells = null;
    this.selectUnlockedCells = null;
    this.sheet = true; //Otherwise this is a bit pointless, don't you think?
    this.sort = null;
    this.spinCount = null;
};

_.extend(SheetProtection.prototype, {

    exportXML: function (doc) {
        var attrs = {};
        var sheetProtection = doc.createElement('sheetProtection', attrs);

        if(this.sheet === true) {

            if(this.unhashedValue) {
                var forge = require('node-forge');
                var md = forge.md[this.algorithmName].create();
                if(!this.saltValue) {
                    //Bad human! Bad!
                    this.saltValue = Math.random().toString(36).substr(2, 5);
                }
                var spinCount = this.spinCount = this.spinCount || 1000;
                var pass = this.saltValue + '' + this.unhashedValue;

                this.saltValue = new Buffer(this.saltValue).toString('base64')

                while(spinCount--) {
                    md.update(pass);
                    pass=md.digest().toHex();
                }

                this.hashValue = new Buffer(pass).toString('base64');

            }

            util.setAttributesOnDoc(sheetProtection, {
                algorithmName: this.algorithmName,
                autoFilter: {v: this.autoFilter, type: Boolean},
                deleteColumns: {v: this.deleteColumns, type: Boolean},
                deleteRows: {v: this.deleteRows, type: Boolean},
                formatCells: {v: this.formatCells, type: Boolean},
                formatColumns: {v: this.formatColumns, type: Boolean},
                formatRows: {v: this.formatRows, type: Boolean},
                hashValue: this.hashValue,
                insertColumns: {v: this.insertColumns, type: Boolean},
                insertHyperlinks: {v: this.insertHyperlinks, type: Boolean},
                insertRows: {v: this.insertRows, type: Boolean},
                objects: {v: this.objects, type: Boolean},
                pivotTables: {v: this.pivotTables, type: Boolean},
                saltValue: this.saltValue,
                scenarios: {v: this.scenarios, type: Boolean},
                selectLockedCells: {v: this.selectLockedCells, type: Boolean},
                selectUnlockedCells: {v: this.selectUnlockedCells, type: Boolean},
                sheet: {v: this.sheet, type: Boolean},
                spinCount: this.spinCount
            });
        }

        return sheetProtection;
    }
});

SheetProtection.algorithms = {MD5: 'md5', SHA1: 'sha1', SHA256: 'sha256', SHA384: 'sha384', SHA512: 'sha512'};


module.exports = SheetProtection;