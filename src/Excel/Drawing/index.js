"use strict";
var _ = require('lodash');
var AbsoluteAnchor = require('./AbsoluteAnchor');
var OneCellAnchor = require('./OneCellAnchor');
var TwoCellAnchor = require('./TwoCellAnchor');

/**
 * This is mostly a global spot where all of the relationship managers can get and set
 * path information from/to. 
 * @module Excel/Drawing
 */
var Drawing = function () {
    this.id = _.uniqueId('Drawing');
};

_.extend(Drawing.prototype, {
    /**
     *
     * @param {String} type Can be 'absoluteAnchor', 'oneCellAnchor', or 'twoCellAnchor'.
     * @param {Object} config Shorthand - pass the created anchor coords that can normally be used to construct it.
     * @returns {Anchor}
     */
    createAnchor: function (type, config) {
        config = config || {};
        config.drawing = this;
        switch(type) {
            case 'absoluteAnchor':
                this.anchor = new AbsoluteAnchor(config);
                break;
            case 'oneCellAnchor':
                this.anchor = new OneCellAnchor(config);
                break;
            case 'twoCellAnchor':
                this.anchor = new TwoCellAnchor(config);
                break;
        }
        return this.anchor;
    }
});

module.exports = _.extend(Drawing, {
    AbsoluteAnchor: require('./AbsoluteAnchor'),
    Chart: require('./Chart'),
    OneCellAnchor: require('./OneCellAnchor'),
    Picture: require('./Picture'),
    TwoCellAnchor: require('./TwoCellAnchor')
});
