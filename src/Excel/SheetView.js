/**
 * @module Excel/SheetView
 *
 * https://msdn.microsoft.com/en-us/library/documentformat.openxml.spreadsheet.sheetview%28v=office.14%29.aspx
 *
 */
"use strict";
var _ = require('lodash');
var Pane = require('./Pane');

var SheetView = function (config) {
    config = config || {};

    this.pane = config.pane || new Pane();
    this.showZeros = null; //Default
    this.defaultGridColor = null;
    this.colorId = null;
    this.rightToLeft = null;
    this.showFormulas = null;
    this.showGridLines = null;
    this.showOutlineSymbols = null;
    this.showRowColHeaders = null;
    this.showRuler = null;
    this.showWhiteSpace = null;
    this.tabSelected = null;
    this.topLeftCell = null;
    this.viewType = null; //http://www.datypic.com/sc/ooxml/t-ssml_ST_SheetViewType.html
    this.windowProtection = null;
    this.zoomScale = null;
    this.zoomScaleNormal = null;
    this.zoomScalePageLayoutView = null;
    this.zoomScaleSheetLayoutView = null;
};

_.extend(SheetView.prototype, {

    /**
     * Added froze pane
     * @param column - column number: 0, 1, 2 ...
     * @param row - row number: 0, 1, 2 ...
     * @param cell - 'A1'
     * @deprecated
     */
    freezePane: function(column, row, cell) {
        this.pane.state = 'frozen';
        this.pane.xSplit = column;
        this.pane.ySplit = row;
        this.pane.topLeftCell = cell;
    },

    exportXML: function (doc) {
        var sheetViews = doc.createElement('sheetViews'),
            sheetView = doc.createElement('sheetView');

        //TODO apparent you can add 'book views'.. investigate what these are
        sheetView.setAttribute('workbookViewId', 0);

        if(this.showZeros !== null) {
            sheetView.setAttribute('showZeros', this.showZeros ? '1' : '0');
        }
        if(this.defaultGridColor !== null) {
            sheetView.setAttribute('defaultGridColor', this.defaultGridColor ? '1' : '0');
        }

        //TODO: I have no idea what this even is :\
        if(this.colorId !== null) {
            sheetView.setAttribute('colorId', this.colorId);
        }
        if(this.rightToLeft !== null) {
            sheetView.setAttribute('rightToLeft', this.rightToLeft ? '1' : '0');
        }
        if(this.showFormulas !== null) {
            sheetView.setAttribute('showFormulas', this.showFormulas ? '1' : '0');
        }
        if(this.showGridLines !== null) {
            sheetView.setAttribute('showGridLines', this.showGridLines ? '1' : '0');
        }
        if(this.showOutlineSymbols !== null) {
            sheetView.setAttribute('showOutlineSymbols', this.showOutlineSymbols ? '1' : '0');
        }
        if(this.showRowColHeaders !== null) {
            sheetView.setAttribute('showRowColHeaders', this.showRowColHeaders ? '1' : '0');
        }
        if(this.showRuler !== null) {
            sheetView.setAttribute('showRuler', this.showRuler ? '1' : '0');
        }
        if(this.showWhiteSpace !== null) {
            sheetView.setAttribute('showWhiteSpace', this.showWhiteSpace ? '1' : '0');
        }
        if(this.tabSelected !== null) {
            sheetView.setAttribute('tabSelected', this.tabSelected ? '1' : '0');
        }
        if(this.viewType !== null) {
            sheetView.setAttribute('viewType', this.viewType);
        }
        if(this.windowProtection !== null) {
            sheetView.setAttribute('windowProtection', this.windowProtection ? '1' : '0');
        }
        if(this.zoomScale !== null) {
            sheetView.setAttribute('zoomScale', this.zoomScale ? '1' : '0');
        }
        if(this.zoomScale !== null) {
            sheetView.setAttribute('zoomScale', this.zoomScale);
        }
        if(this.zoomScaleNormal !== null) {
            sheetView.setAttribute('zoomScaleNormal', this.zoomScaleNormal);
        }
        if(this.zoomScalePageLayoutView !== null) {
            sheetView.setAttribute('zoomScalePageLayoutView', this.zoomScalePageLayoutView);
        }
        if(this.zoomScaleSheetLayoutView !== null) {
            sheetView.setAttribute('zoomScaleSheetLayoutView', this.zoomScaleSheetLayoutView);
        }

        sheetView.appendChild(this.pane.exportXML(doc));

        sheetViews.appendChild(sheetView);
        return sheetViews;
    }
});

module.exports = SheetView;