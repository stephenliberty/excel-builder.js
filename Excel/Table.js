define(['underscore', './util'], function (_, util) {
	var Table = function (config) {
        this.initialize(config);
    };
    _.extend(Table.prototype, {
		
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
		totalsRowShown: false,
		tableColumns: [],
		autoFilter: null,
		sortState: null,
		tableStyleInfo: {},
		
		initialize: function (config) {
			this.displayName = _.uniqueId("Table");
			this.name = this.displayName;
			this.id = _.uniqueId("Table");
			this.tableId = this.id.replace('Table', '');
			_.extend(this, config);
		},
		
		addTableColumns: function (columns) {
			_.each(columns, function (column) { this.addTableColumn(column); }, this);
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
			if(_.isString(column)) { column = {name: column}; }
			if(!column.name) { throw "Invalid argument for addTableColumn - minimum requirement is a name property"; }
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
			var doc = util.createXmlDoc(util.schemas.table, 'worksheet');
            var table = doc.documentElement;
			if(!this.ref) {throw "Needs at least a reference range";}
			if(!this.autoFilter) {
				
			}
			
			return table;
		}
	});
	return Table;
});