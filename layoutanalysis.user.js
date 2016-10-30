// ==UserScript==
// @name         Webpage Layout Analysis - PouchDB persisted
// @namespace    https://github.com/fbuchinger/gl-layout-analysis-tampermonkey
// @version      0.1.2
// @description  try to take over the world!
// @author       You
// @match        https://web.archive.org/web/*
// @match        http://web.archive.org/web/*
// @require https://code.jquery.com/jquery-latest.js
// @require      https://raw.githubusercontent.com/fbuchinger/jquery.layoutstats/master/src/jquery.layoutstats.js
// ==/UserScript==


function measureLayout() {
    var measurements = jQuery('body').layoutstats('getUniqueFontStyles');
    measurements._id = location.href;
    measurements.ISOTimeStamp = (new Date).toISOString();
    if (measurements.textVisibleCharCount && measurements.textVisibleCharCount > 0) {
        window.opener.postMessage(measurements, '*');
    }
    else {
        window.setTimeout(measureLayout, 500);
    }
}

$(document).ready(function(){
    //document.addEventListener('DOMContentLoaded', function() {
    $('#wm-ipp-inside').find('a[href="#close"]').trigger('click'); // hide internet archive navigator
    measureLayout();
});



