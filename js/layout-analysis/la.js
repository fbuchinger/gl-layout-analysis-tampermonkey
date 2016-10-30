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
