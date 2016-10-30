var LAOverview = P(LayoutAnalysisPlugin, function(proto, parent, cls, parentcls){

    proto.render = function ($pluginContainer){
        parent.render.call(this, $pluginContainer);
        var $pluginUI = jQuery(cls.template);
        $pluginUI.appendTo(this.$pluginDivBody);

        var currentDomain = this.la.domain;
        db.getAllMeasurementsForDomain(currentDomain).then(function(result){
            $('#la-meas-per-domain').text(result.rows.length);
            $('#la-meas-domain').text(currentDomain);
            /*var measuredLinks = result.rows.map(function(row){
             var linkPrefix = '://web.archive.org';
             var relLink = row.id.slice(row.id.indexOf(linkPrefix) + linkPrefix.length);
             return 'a[href="'+ relLink +'"]';
             });
             var mearsuredLinkSel = measuredLinks.join(', ');
             jQuery(mearsuredLinkSel).addClass('measured-day');*/
        });

    }

    return {
        name: "Overview",
        description: "An overview of the already collected layout measurements",
    }
});
//LayoutAnalysis.registerPlugin('Overview', LAOverview);



LAOverview.template = [
    '<div>',
    '<p>',
    '<span id="la-meas-per-domain"></span> Measurements for <span id="la-meas-domain"></span>&nbsp;&nbsp;&nbsp;',
    '<button id="la-csv-download">Download .CSV</button>',
    '</p>',
    '<p>',
    'Measurements for <span id="la-measured-domain-num"></span> domains available. See overview page for <select id="la-measured-domains"></select>',
    '<button id="la-goto-page">Go!</button>',
    '</p>',
    '<div>'
].join('');
LAOverview.styles = [
    '#la-overview {',
    'text-align: left !important;',
    'border: 1px solid rgb(204, 204, 204);',
    'padding: 5px;',
    'background-color: rgba(235, 235, 239, 0.49);',
    '} ',

    '#la-overview h1 {',
    'font-size: 18px;',
    'text-align: left;',
    '} ',

    '#la-overview p {',
    'font-size: 12px;',
    'text-align: left;',
    '} ',

    '.measured-day {',
    'font-style: italic !important;',
    'font-weight: normal !important;',
    'color: green !important;',
    '} ',

    '.measuring-day a {',
    'font-style: italic !important;',
    'font-weight: normal !important;',
    'color: red !important;',
    '} ',

].join('\n');
