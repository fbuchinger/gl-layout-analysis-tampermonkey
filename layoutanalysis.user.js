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

//https://github.com/jneen/pjs/blob/master/src/p.js
var P=function(n,t,r){return function e(i,o){function c(){var n=this instanceof c?this:new u;return n.init.apply(n,arguments),n}function u(){}o===r&&(o=i,i=Object),c.Bare=u;var f,a=u[n]=i[n],p=u[n]=c[n]=c.p=new u;return p.constructor=c,c.extend=function(n){return e(c,n)},(c.open=function(n){if("function"==typeof n&&(n=n.call(c,p,a,c,i)),"object"==typeof n)for(f in n)t.call(n,f)&&(p[f]=n[f]);return"init"in p||(p.init=i),c})(o)}}("prototype",{}.hasOwnProperty);


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

util.addStylesheet = function (cssUrl){
    var head, link;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = cssUrl;
    head.appendChild(link);
}

var isSnapshotPage = /\/web.archive.org\/web\/(\d+)\//.test(location.href) && location.href.indexOf('web.archive.org/web') > -1;
var isWebArchiveOverviewPage =  location.href.indexOf('overview_guardian.html') > -1;
var db = new PouchDB('layoutanalysis');

db.getAllMeasurementsForDomain = function (domain){
    var cleanedDomain = domain.split('http://').join('').split('https://').join('').split('www.').join('');
    return db.query(function(doc, emit){
            //todo: make domain prefix/protocol tolerant http://www vs http://

            if (doc._id.indexOf(cleanedDomain) > -1) {
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

var LayoutAnalysis = P(function(proto, parent, cls, supercls){
    proto.init = function (config){
        this.domain = config.domain;
        this.domains = config.domains;
        var self = this;
        this.plugins = cls.plugins.map(function(plugin){
            var pluginInst = new plugin.cls;
            pluginInst.la = self;
            return pluginInst;
        });
    }

    proto.appendTo = function (div){
        var self = this;
        var $containerDiv = jQuery(div);
        jQuery(cls.template).appendTo(jQuery(div));
        this.plugins.forEach(function(plugin){
           plugin.render($containerDiv.find('.la-plugins'));
        });
    }
});
LayoutAnalysis.registerPlugin = function (name, cls){
    this.plugins = this.plugins || [];
    this.plugins.push({name: name, cls: cls});
}

LayoutAnalysis.template =  [
    '<div class="la-container">',

    '<h1>Layout Analysis</h1>',
        '<div class="la-plugins">',
        '</div">',
    '</div>'
].join('');

var LayoutAnalysisPlugin = P(function(proto, parent, cls, parentcls){
    proto.init = function (){

    }
    proto.render = function ($pluginContainer){
        this.$pluginDiv = jQuery(this.template);
        this.$pluginDiv.appendTo($pluginContainer);
        this.$pluginDiv.find('.la-plugin-title').html(this.name);
        this.$pluginDivBody =  this.$pluginDiv.find('.la-plugin-body');
        return this.$pluginDivBody;
    }
    return {
        name: 'Base Plugin - please overwrite',
        description: 'Base Plugin Description - please overwrite',
        template: ['<div class="la-plugin">',
                        '<div class="la-plugin-header">',
                            '<h2 class="la-plugin-title"></h2>',
                        '</div>',
                        '<div class="la-plugin-body">',
                        '</div>',
                    '</div>'].join('')
    }
});

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


var LAMeasure = P(LayoutAnalysisPlugin, function(proto, parent, cls, parentcls){

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
        name: "Measure",
        description: "An overview of the already collected layout measurements",
    }
});
LAMeasure.template = `
 <form class="pure-form pure-form-aligned">
    <fieldset>
        <div class="pure-control-group">
            <label for="name">Name</label>
            <input id="name" type="text" placeholder="Name of Measurement">
        </div>

        <div class="pure-control-group">
             <label for="newspapers">Newspapers</label>
             <select id="newspapers" size="5" multiple="true">
                <option>Die Presse</option>
                <option>Clarin</option>
                <option>El Universal</option>
              </select>
        </div>

         <div class="pure-control-group">
            <label for="start-date">Start Date:</label>
            <input id="start-date" type="date" value="2005-01-01">
        </div>


         <div class="pure-control-group">
            <label for="end-date">End Date:</label>
            <input id="end-date" type="date" value="2015-01-01">
        </div>

         <div class="pure-control-group">
             <label for="interval">Interval</label>
             <select id="interval">
                <option>Yearly</option>
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Daily</option>
              </select>
        </div>


        <div class="pure-controls">
            <button type="submit" class="pure-button pure-button-primary">Start</button>
        </div>
    </fieldset>
</form>
`;


LayoutAnalysis.registerPlugin('Measure', LAMeasure);

var LAMeasureWindow = P(function(proto){
    proto.open = function (url){
        var dfd = jQuery.Deferred();
        this.measurewin = window.open(url,'_blank');
        var self = this;
        var messageEvtID = 'message.id' + (new Date).getTime().toString(32);

        $(window).bind(messageEvtID, function(evt){
            oEvent = evt.originalEvent;
            if (!url.startsWith(oEvent.origin))  {
                return false;
            }

            var measurements = oEvent.data;
            db.put(measurements, function callback(err, result) {
                if (!err) {

                }
                self.measurewin.close();
                dfd.resolve();
            });
            $(window).unbind(messageEvtID);
        });

        window.setTimeout(function(){
            dfd.reject();
        },60000);
        return dfd.promise();

    }

    proto.openFromList = function (urlList){
        var url = urlList.pop();
        if (!url){
            return false;
        }
        var self = this;
        if (url){
            this.open(url).then(function(){
                self.openFromList(urlList);
            });
        }
    }

});





util.addStylesheet("https://cdn.jsdelivr.net/pure/0.6.0/pure-min.css");

if (!isWebArchiveOverviewPage){
    $(document).ready(function(){
        //document.addEventListener('DOMContentLoaded', function() {
        $('#wm-ipp-inside').find('a[href="#close"]').trigger('click'); // hide internet archive navigator
        measureLayout();
    });
}
else{
    var la = new LayoutAnalysis({
        domain: $('.wbUrl').text(),
        domains: [
            {name: 'Clarin.com', url: 'http://clarin.com'},
            {name: 'Die Presse', url: 'http://diepresse.com'},
            {name: 'El Pais', url: 'http://elpais.com'},
            {name: 'El Universal', url: 'http://eluniversal.com.mx'},
            {name: 'Guardian', url: 'http://guardian.co.uk'},
            {name: 'La Repubblica', url: 'http://www.repubblica.it'},
            {name: 'Le Figaro', url: 'http://lefigaro.fr'},
            {name: 'New York Times', url: 'http://nytimes.com'},
            {name: 'O Globo', url: 'http://oglobo.globo.com'},
            {name: 'Sueddeutsche.de', url: 'http://www.sueddeutsche.de'},
        ]
    });
    la.appendTo($('#wbMeta'));
    lawin = new LAMeasureWindow();
    lawin1 = new LAMeasureWindow();
    lawin2 = new LAMeasureWindow();
    $(window).bind('message', function(){
        console.log(arguments);
    });
    var urlList = [
        'https://web.archive.org/web/20050115/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050215/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050315/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050415/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050515/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050615/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050715/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050815/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20050915/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20051015/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20051115/http://www.guardian.co.uk/',
        'https://web.archive.org/web/20051215/http://www.guardian.co.uk/'
    ];

    lawin.openFromList(urlList);
    //lawin1.openFromList(urlList);
    //lawin2.openFromList(urlList);



    /*
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
    });*/
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
    measurements.ISOTimeStamp = (new Date).toISOString();
    if (measurements.textVisibleCharCount && measurements.textVisibleCharCount > 0){
        window.opener.postMessage(measurements,'*');
        /*db.put(measurements, function callback(err, result) {
            if (!err) {
                document.title = "[OK] " + document.title;
            }
        });*/
    }
    else {
        window.setTimeout(measureLayout,500);
    }
}