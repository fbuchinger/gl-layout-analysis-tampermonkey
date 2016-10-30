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