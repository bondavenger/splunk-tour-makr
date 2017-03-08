define(
    [
        'underscore',
        'jquery',
        'backbone',
        'module',
        'views/Base',
        'views/shared/controls/ControlGroup'
    ],
    function(
        _,
        $,
        Backbone,
        module,
        BaseView,
        ControlGroup
        ){
        return BaseView.extend({
            moduleId: module.id,
            className: 'step collapsible-group',
            initialize: function(){
                BaseView.prototype.initialize.apply(this, arguments);

                this.stepNum = this.options.stepNum || 1;
                this.element = this.options.element || '';
                this.caption = this.options.caption || '';
                
                this.stepElementID = 'stepElement' + this.stepNum;
                this.stepCaptionID = 'stepText' + this.stepNum;
                this.setCaption(this.caption);
            },

            events: {
                'blur .step-caption-input': function(e) {
                    var captionVal = $(e.currentTarget).val().trim();
                    this.setCaption(captionVal);
                    this.model.tour.save();
                },
                'click .select-element': function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.trigger('getElement', this.stepNum);
                },
                'click .remove-step': function(e) {
                    e.preventDefault();
                    this.trigger('removeStep');
                },
                'click .edit-step-element': function(e) {
                    e.preventDefault();
                    this.editStepElement();
                },
                'click .save-element': function(e) {
                    e.preventDefault();
                    this.setStepElement();
                },
                'click .cancel-element': function(e) {
                    e.preventDefault();
                    this.setStepElement(this.oldVal);
                }
            },

            setCaption: function(val) {
                this.model.tour.entry.content.set(this.stepCaptionID, val);
            },

            editStepElement: function() {
                this.children.stepElement = new ControlGroup({
                    controlType: 'Text',
                    defaultValue: 'none',
                    controlOptions: {
                        modelAttribute: this.stepElementID,
                        model: this.model.tour.entry.content,
                        defaultValue: 'none2'
                    },
                    label: _('Element').t()
                });
                this.oldVal = this.model.tour.entry.content.get(this.stepElementID);

                this.$('.step-element').html(this.children.stepElement.render().el);
                this.$('.element-edit-action').show();
                this.$('.element-edit').hide();
            },

            setStepElement: function(setModelVal) {
                if (setModelVal) {
                    this.model.tour.entry.content.set(this.stepElementID, setModelVal);
                }

                this.children.stepElementLabel = new ControlGroup({
                    controlType: 'Label',
                    controlOptions: {
                        modelAttribute: this.stepElementID,
                        model: this.model.tour.entry.content
                    },
                    label: _('Element').t()
                });
                this.$('.step-element').html(this.children.stepElementLabel.render().el);
                this.$('.element-edit').show();
                this.$('.element-edit-action').hide();
                this.model.tour.save();
            },

            render: function() {
                this.$el.html(this.compiledTemplate({
                    stepNum: this.stepNum,
                    element: this.element || 'none',
                    caption: this.caption
                }));

                this.setStepElement();
                return this;
            },

            template: '\
                <h4>\
                    Step <span class="step-num"><%- stepNum %></span>\
                    <a class="remove-step pull-right"><i class="icon icon-x-circle"></i></a>\
                </h4>\
                <div class="step-assets">\
                    <div class="step-caption">\
                        <div class="control-label">Caption</div>\
                        <textarea class="step-caption-input" id="stepText<%- stepNum %>"><%- caption %></textarea>\
                    </div>\
                    <div class="step-elelment-container">\
                        <span class="step-element"><%- element %></span>\
                        <div class="element-edit">\
                            <a href="#" class="edit-step-element"> <i class="icon icon-pencil"></i>Edit<a>\
                            <a href="#" class="btn select-element" data-step="<%- stepNum %>">Select Element</a>\
                        </div>\
                        <div class="element-edit-action">\
                            <a href="#" class="btn btn-primary save-element">Save</a>\
                            <a href="#" class="btn btn-primary cancel-element">Cancel</a>\
                        </div>\
                    </div>\
                </div>\
            '
        });
    }
);