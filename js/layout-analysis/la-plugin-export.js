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
