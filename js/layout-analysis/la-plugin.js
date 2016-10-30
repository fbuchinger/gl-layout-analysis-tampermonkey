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
