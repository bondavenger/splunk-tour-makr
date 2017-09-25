require(['app/views/Help'], function(HelpView) {
    const toursHelp = new HelpView();
    $('.help-body').append(toursHelp.render().el);
});
