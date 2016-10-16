// ==UserScript==
// @name         Webpage Layout Analysis - PouchDB persisted
// @namespace    https://github.com/fbuchinger/gl-layout-analysis-tampermonkey
// @version      0.1.2
// @description  try to take over the world!
// @author       You
// @match        https://web.archive.org/web/*
// @match        http://web.archive.org/web/*
// @grant        GM_addStyle
// @require https://code.jquery.com/jquery-latest.js
// @require https://cdnjs.cloudflare.com/ajax/libs/pouchdb/6.0.5/pouchdb.min.js
// @require      https://raw.githubusercontent.com/fbuchinger/jquery.layoutstats/master/src/jquery.layoutstats.js
// ==/UserScript==

var util = {};

util.addGlobalStyle = function (css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

var isWebArchiveOverviewPage = location.href.indexOf('*') > -1;
var db = new PouchDB('layoutanalysis');

db.getAllMeasurementsForDomain = function (domain){
    return db.query(function(doc, emit){
            if (doc._id.indexOf(domain) > -1) {
                emit(doc._id)
            }
        },{includeDocs:true});
}

db.getMeasuredDomains = function (){
    var mapReduce = {
        map: function (doc, emit){
            var domainURL = domainURL = doc._id.split('://');
            if(domainURL[2]){
                var protocol = (domainURL[1].endsWith('https') ? 'https' : 'http');
                emit(protocol + '://' +  domainURL[2].split('/')[0]);
            }
        },
        reduce: '_count'
    }
    return db.query(mapReduce, {
        reduce: true, group: true
    })
}

var LayoutAnalysisTpl = [
    '<div id="la-overview">',
        '<h1>Layout Analysis</h1>',
        '<p>',
            '<span id="la-meas-per-domain"></span> Measurements for <span id="la-meas-domain"></span>&nbsp;&nbsp;&nbsp;',
            '<button id="la-csv-download">Download .CSV</button>',
        '</p>',
        '<p>',
        'Measurements for <span id="la-measured-domain-num"></span> domains available. See overview page for <select id="la-measured-domains"></select>',
        '<button id="la-goto-page">Go!</button>',
        '</p>',
    '</div>'
].join('');

var LayoutAnalysisStyle = [
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

util.addGlobalStyle(LayoutAnalysisStyle);

if (!isWebArchiveOverviewPage){
    $(document).ready(function(){
        //document.addEventListener('DOMContentLoaded', function() {
        $('#wm-ipp-inside').find('a[href="#close"]').trigger('click'); // hide internet archive navigator
        measureLayout();
    });
}
else{
    $('#wbMeta').append(LayoutAnalysisTpl);
    var currentDomain = $('.wbUrl').text();
    $('#la-meas-domain').text(currentDomain);

    db.getAllMeasurementsForDomain(currentDomain).then(function(result){
        $('#la-meas-per-domain').text(result.rows.length);
        var measuredLinks = result.rows.map(function(row){
            var linkPrefix = '://web.archive.org';
            var relLink = row.id.slice(row.id.indexOf(linkPrefix) + linkPrefix.length);
            return 'a[href="'+ relLink +'"]';
        });
        var mearsuredLinkSel = measuredLinks.join(', ');
        jQuery(mearsuredLinkSel).addClass('measured-day');
    });

    db.getMeasuredDomains().then(function(result){
        $('#la-measured-domain-num').text(result.rows.length);
        var options = result.rows.map(function(row){
            return '<option>' + row.key + '</option>';
        });
        $('#la-measured-domains').append(options.join(''));
    });

    //indicate ongoing measurements
    $('#wbCalendar .day').click(function(){
       $(this).addClass('measuring-day');
    });

    $('#la-csv-download').click(function(){
        exportMeasurements();
    });
}

function exportMeasurements(){

    db.query((function(doc, emit){
        //TODO: add result filtering
        emit(doc);
    }),{include_docs:true}).then(function(docs){
        var primitiveKeys = getPrimitiveKeys(docs.rows[0].key || {});
        primitiveKeys.sort();
        var csvResult = docs.rows.map(function(row){
            var rowData = primitiveKeys.map(function(key){
                return row.doc[key];
            });
            return rowData.join(';') + ';';
        });
        csvResult.unshift(primitiveKeys.join(';') + ';');
        download(csvResult.join('\r\n'),'data.csv');
    });
}

function getPrimitiveKeys(obj){
    return Object.keys(obj).filter(function(val){
        return (typeof(obj[val]) === "number" || typeof(obj[val]) === "string");
    });
}

function download(content, filename, contentType)
{
    if(!contentType) contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content], {'type':contentType});
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}


function measureLayout (){
    var measurements = jQuery('body').layoutstats('getUniqueFontStyles');
    measurements._id = location.href;
    debugger;
    measurements.ISOTimeStamp = (new Date).toISOString();
    if (measurements.textVisibleCharCount && measurements.textVisibleCharCount > 0){
        db.put(measurements, function callback(err, result) {
            if (!err) {
                document.title = "[OK] " + document.title;
            }
        });
    }
    else {
        window.setTimeout(measureLayout,500);
    }
}