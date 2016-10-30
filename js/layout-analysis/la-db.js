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
