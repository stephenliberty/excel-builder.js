/**
 * @module Excel/Table
 */
define(['underscore', './util'], function (_, util) {
    "use strict";
    var Table = function (config) {
        _.defaults(this, {
            name: "",
            displayName: "",
            dataCellStyle: null,
            dataDfxId: null,
            headerRowBorderDxfId: null,
            headerRowCellStyle: null,
            headerRowCount: 1,
            headerRowDxfId: null,
            insertRow: false,
            insertRowShift: false,
            ref: null,
            tableBorderDxfId: null,
            totalsRowBorderDxfId: null,
            totalsRowCellStyle: null,
            totalsRowCount: 0,
            totalsRowDxfId: null,
            tableColumns: [],
            autoFilter: null,
            sortState: null,
            styleInfo: {}
        });
        this.initialize(config);
    };
    _.extend(Table.prototype, {
		
        initialize: function (config) {
            this.displayName = _.uniqueId("Table");
            this.name = this.displayName;
            this.id = this.name;
            this.tableId = this.id.replace('Table', '');
            _.extend(this, config);
        },
		
        setReferenceRange: function (start, end) {
            this.ref = [start, end];
        },
		
        setTableColumns: function (columns) {
            _.each(columns, function (column) {
                this.addTableColumn(column);
            }, this);
        },
		
        /**
        * Expects an object with the following optional properties:
        * name (required)
        * dataCellStyle 
        * dataDxfId
        * headerRowCellStyle
        * headerRowDxfId
        * totalsRowCellStyle
        * totalsRowDxfId
        * totalsRowFunction
        * totalsRowLabel
        * columnFormula
        * columnFormulaIsArrayType (boolean)
        * totalFormula
        * totalFormulaIsArrayType (boolean)
        */
        addTableColumn: function (column) {
            if(_.isString(column)) {
                column = {
                    name: column
                };            
            }
            if(!column.name) {
                throw "Invalid argument for addTableColumn - minimum requirement is a name property";
            }
            this.tableColumns.push(column);
        },
		
        /**
        * Expects an object with the following properties:
        * caseSensitive (boolean)
        * dataRange
        * columnSort (assumes true)
        * sortDirection
        * sortRange (defaults to dataRange)
        */
        setSortState: function (state) {
            this.sortState = state;
        },
		
        toXML: function () {
            var doc = util.createXmlDoc(util.schemas.spreadsheetml, 'table');
            var table = doc.documentElement;
            table.setAttribute('id', this.tableId);
            table.setAttribute('name', this.name);
            table.setAttribute('displayName', this.displayName);
            var s = this.ref[0];
            var e = this.ref[1];
            table.setAttribute('ref', util.positionToLetterRef(s[0], s[1]) + ":" + util.positionToLetterRef(e[0], e[1]));
            
            /** TOTALS **/
            table.setAttribute('totalsRowCount', this.totalsRowCount);
            
            /** HEADER **/
            table.setAttribute('headerRowCount', this.headerRowCount);
            if(this.headerRowDxfId) {
                table.setAttribute('headerRowDxfId', this.headerRowDxfId);
            }
            if(this.headerRowBorderDxfId) {
                table.setAttribute('headerRowBorderDxfId', this.headerRowBorderDxfId);
            }
			
            if(!this.ref) {
                throw "Needs at least a reference range";
            }
            if(!this.autoFilter) {
                this.addAutoFilter(this.ref[0], this.ref[1]);
            }
			
            table.appendChild(this.exportAutoFilter(doc));
			
            table.appendChild(this.exportTableColumns(doc));
            table.appendChild(this.exportTableStyleInfo(doc));
            return doc;
        },
		
        exportTableColumns: function (doc) {
            var tableColumns = doc.createElement('tableColumns');
            tableColumns.setAttribute('count', this.tableColumns.length);
            var tcs = this.tableColumns;
            for(var i = 0, l = tcs.length; i < l; i++) {
                var tc = tcs[i];
                var tableColumn = doc.createElement('tableColumn');
                tableColumn.setAttribute('id', i + 1);
                tableColumn.setAttribute('name', tc.name);
                tableColumns.appendChild(tableColumn);
                
                if(tc.totalsRowFunction) {
                    tableColumn.setAttribute('totalsRowFunction', tc.totalsRowFunction);
                }
                if(tc.totalsRowLabel) {
                    tableColumn.setAttribute('totalsRowLabel', tc.totalsRowLabel);
                }
            }
            return tableColumns;
        },
		
        exportAutoFilter: function (doc) {
            var autoFilter = doc.createElement('autoFilter');
            var s = this.autoFilter[0];
            var e = this.autoFilter[1];
            autoFilter.setAttribute('ref', util.positionToLetterRef(s[0], s[1]) + ":" + util.positionToLetterRef(e[0], e[1]  - this.totalsRowCount));
            return autoFilter;
        },
		
        exportTableStyleInfo: function (doc) {
            var ts = this.styleInfo;
            var tableStyle = doc.createElement('tableStyleInfo');
            tableStyle.setAttribute('name', ts.themeStyle);
            tableStyle.setAttribute('showFirstColumn', ts.showFirstColumn ? "1" : "0");
            tableStyle.setAttribute('showLastColumn', ts.showLastColumn ? "1" : "0");
            tableStyle.setAttribute('showColumnStripes', ts.showColumnStripes ? "1" : "0");
            tableStyle.setAttribute('showRowStripes', ts.showRowStripes ? "1" : "0");
            return tableStyle;
        },
		
        addAutoFilter: function (startRef, endRef) {
            this.autoFilter = [startRef, endRef];
        }
    });
    return Table;
});
