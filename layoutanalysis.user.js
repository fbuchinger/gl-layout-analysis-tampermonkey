// ==UserScript==
// @name         Webpage Layout Analysis - PouchDB persisted
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://web.archive.org/web/*
// @match        http://web.archive.org/web/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// @require https://cdnjs.cloudflare.com/ajax/libs/pouchdb/6.0.5/pouchdb.min.js
// @require      file://E:/dev/gl-newspaper-layout-analysis/lib/jquery.layoutstats/src/jquery.layoutstats.js
// ==/UserScript==
/* jshint -W097 */


var isWebArchiveOverviewPage = location.href.indexOf('*') > -1;
var db = new PouchDB('layoutanalysis');

if (!isWebArchiveOverviewPage){
    $(document).ready(function(){
        //document.addEventListener('DOMContentLoaded', function() {
        $('#wm-ipp-inside').find('a[href="#close"]').trigger('click'); // hide internet archive navigator
        measureLayout();
    });
}
else{
    $('#wbMeta').prepend('<button id="export-measurements">Export Measurements</button>');
    $('#export-measurements').click(function(){
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