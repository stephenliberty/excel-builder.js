define([], function () {
    "use strict";
    return {
        /**
         * Converts pixel sizes to 'EMU's, which is what Open XML uses. 
         * 
         * @todo clean this up. Code borrowed from http://polymathprogrammer.com/2009/10/22/english-metric-units-and-open-xml/,
         * but not sure that it's going to be as accurate as it needs to be.
         * 
         * @param int pixels
         * @returns int
         */
        pixelsToEMUs: function (pixels) {
            return Math.round(pixels * 914400 / 96);
        }
    };
});