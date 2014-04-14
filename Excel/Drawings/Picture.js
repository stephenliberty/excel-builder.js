define(['./Drawing', 'underscore', '../util'], function (Drawing, _, util) {
    "use strict";
    var Picture = function () {
        this.media = null;
        this.id = _.uniqueId('Picture');
        this.pictureId = util.uniqueId('Picture');
        this.fill = {};
        this.mediaData = null;
    };
    //
    Picture.prototype = new Drawing();
    
    _.extend(Picture.prototype, {
        setMedia: function (mediaRef) {
            this.mediaData = mediaRef;
        },
        setDescription: function (description) {
            this.description = description;
        },
        setFillType: function (type) {
            this.fill.type = type;
        },
        setFillConfig: function (config) {
            _.extend(this.fill, config);
        },
        getMediaType: function () {
            return 'image';
        },
        getMediaData: function () {
            return this.mediaData;
        },
        setRelationshipId: function (rId) {
            this.mediaData.rId = rId;
        },
        toXML: function (xmlDoc) {
            var pictureNode = util.createElement(xmlDoc, 'xdr:pic');
            
            var nonVisibleProperties = util.createElement(xmlDoc, 'xdr:nvPicPr');
            
            var nameProperties = util.createElement(xmlDoc, 'xdr:cNvPr', [
                ['id', this.pictureId],
                ['name', this.mediaData.fileName],
                ['descr', this.description || ""]
            ]);
            nonVisibleProperties.appendChild(nameProperties);
            var nvPicProperties = util.createElement(xmlDoc, 'xdr:cNvPicPr');
            nvPicProperties.appendChild(util.createElement(xmlDoc, 'a:picLocks', [
                ['noChangeAspect', '1'],
                ['noChangeArrowheads', '1']
            ]));
            nonVisibleProperties.appendChild(nvPicProperties);
            pictureNode.appendChild(nonVisibleProperties);
            var pictureFill = util.createElement(xmlDoc, 'xdr:blipFill');
            pictureFill.appendChild(util.createElement(xmlDoc, 'a:blip', [
                ['xmlns:r', util.schemas.relationships],
                ['r:embed', this.mediaData.rId]
            ]));
            pictureFill.appendChild(util.createElement(xmlDoc, 'a:srcRect'));
            var stretch = util.createElement(xmlDoc, 'a:stretch');
            stretch.appendChild(util.createElement(xmlDoc, 'a:fillRect'));
            pictureFill.appendChild(stretch);
            pictureNode.appendChild(pictureFill);
            
            var shapeProperties = util.createElement(xmlDoc, 'xdr:spPr', [
                ['bwMode', 'auto']
            ]);
            
            var transform2d = util.createElement(xmlDoc, 'a:xfrm');
            shapeProperties.appendChild(transform2d);
            
            var presetGeometry = util.createElement(xmlDoc, 'a:prstGeom', [
                ['prst', 'rect']
            ]);
            shapeProperties.appendChild(presetGeometry);
            
            
            
            pictureNode.appendChild(shapeProperties);
//            <xdr:spPr bwMode="auto">
//                <a:xfrm>
//                    <a:off x="1" y="1"/>
//                    <a:ext cx="1640253" cy="1885949"/>
//                </a:xfrm>
//                <a:prstGeom prst="rect">
//                    <a:avLst/>
//                </a:prstGeom>
//                <a:noFill/>
//                <a:extLst>
//                    <a:ext uri="{909E8E84-426E-40DD-AFC4-6F175D3DCCD1}">
//                        <a14:hiddenFill xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main">
//                            <a:solidFill>
//                                <a:srgbClr val="FFFFFF"/>
//                            </a:solidFill>
//                        </a14:hiddenFill>
//                    </a:ext>
//                </a:extLst>
//            </xdr:spPr>
//            
            return this.anchor.toXML(xmlDoc, pictureNode);
        }
    });
    return Picture;
});