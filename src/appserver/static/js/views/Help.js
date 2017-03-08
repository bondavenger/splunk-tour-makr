define(
    [
        'underscore',
        'jquery',
        'views/Base'
    ],
    function(
        _,
        $,
        BaseView
    ) {
        return BaseView.extend({
            initialize: function() {
                BaseView.prototype.initialize.apply(this, arguments);
                this.render();
            },

            events: {
                'click .advanced-options': function(e) {
                    e.preventDefault();
                    $('.advanced-options-container').toggleClass('open');
                }
            },

            render: function() {
                this.$el.html(this.compiledTemplate());
                $('.help-body').append(this.$el);
            },

            template:'\
                <div class="question">What are image based tours?</div>\
                <div class="answer">\
                    The image based tour is a slideshow of images and captions. With left/right navigation, the user can navigate through the tour at his/her leisure and exit at any time.\
                    <p>\
                        <ul><b>NOTES:</b>\
                            <li> The suggested image size is 960px X 716px but a higher quality image is fine b/c it will be fit into the window. </li>\
                            <li> Captions can contain HTML. </li>\
                        <ul>\
                    </p>\
                </div>\
                \
                <div class="question">What are interactive tours?</div>\
                <div class="answer">The interactive tour is a step-by-step tour that highlights parts of the DOM and gives a caption for each step. Like the image tour, it\'s self guided.\
                    <p>\
                        <ul><b>NOTES:</b>\
                            <li> This tour assumes you will provide DOM selectors (class names or ids). If none is provided or it doesn\'t exist on the page, the step will be centered. </li>\
                            <li> Captions can contain HTML. </li>\
                            <li> These tours are page specific. Having a step by step tour make for one page won\'t work right running the same tour on another page.</li>\
                            <li> <a href="#" class="advanced-options">Advanced options</a>\
                                <div class="advanced-options-container">\
                                    <b>Used if user wants a click event to occur (to reveal a dropdown or reveal a tab pane for instance</b>\
                                    <pre> stepClickEvent[integer] = [mousedown || mouseup || click]\r stepClickElement[integer] = [selector to be "clicked"]</pre>\
                                </div>\
                            </li>\
                        <ul>\
                    </p>\
                </div>\
                \
                <div class="question">How do I edit the tour(s) directly via conf file?</div>\
                <div class="answer">Tours are stored in a conf file: etc/system/default/ui-tour.conf. Any updates directly to the the tours should be done via etc/system/local/ui-tour.conf. As for the tours created via this app, they are stored in the apps directory: etc/apps/tour_makr/local/ui-tour.conf.</div>\
                \
                <div class="question">Where are the images stored?</div>\
                <div class="answer">For the tours created via this app, the images are stored in the apps static directory:  etc/apps/tour_makr/appserver/static/img/[tourname]</div>\
                \
                <div class="question">How do I make a tour launch?</div>\
                <div class="answer">Tours are launched by appending the tour id to the querystring of any url in Splunk. For example, to launch a specific tour on the Reports page, append the querystring: "tour=tour-name". This will launch a tour with the id of "tour-name".</div>\
                \
                <div class="question">How do I make a tour auto popup for users?</div>\
                <div class="answer">I can make a tour auto prompt on a page?! But, of course! To do so, all you need to do is name the tour (set the tour id) to the name of the view you\'re going to use it on and append "-tour" to it. For example:\
                    <p>If you want to auto prompt for a tour on the Reports page, the tour stanza name would need to be [reports-tour].</p>\
                    <ul><b>NOTES:</b>\
                        <li> Once a tour has been skipped or viewed by a user, an attribute is set on that tour as viewed. It will no longer prompt a user after.</li>\
                        <li> Prompts are per user. </li>\
                        <li> To override the viewed state and continually make a prompt occur, simply add "viewed = 0" to your tour. </li>\
                    <ul>\
                </div>\
            '
        });
    }
);
