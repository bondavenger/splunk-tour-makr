define([
    'jquery',
    'underscore',
    'views/Base',
    'views/shared/controls/ControlGroup',
    'app/views/tours/image/Slide',
    'app/views/tours/dialogs/NewImageDialog',
    'app/views/tours/dialogs/EditLabelDialog',
    'app/views/tours/Utils',
    'jquery.ui.sortable',
], function(
    $,
    _,
    BaseView,
    ControlGroup,
    ImageItem,
    NewImageDialog,
    EditLabelDialog,
    Utils
) {
    return class ImageTourEditor extends BaseView {
        initialize() {
            super.initialize(...arguments);

            if (this.model.tour) {
                this.tourLabel = this.model.tour.getLabel();
                this.tourName = this.model.tour.getName();
                this.imageTotal = this.model.tour.getImageTotal();
                this.nextImg = this.imageTotal + 1;
            }

            const forceTour = this.model.tour.forceTour();
            this.model.tour.entry.content.set('forceTour', forceTour);
            this.children.forceTour = new ControlGroup({
                controlType: 'SyntheticCheckbox',
                controlOptions: {
                    modelAttribute: 'forceTour',
                    model: this.model.tour.entry.content,
                },
                label: _('Force tour').t(),
            });

            const skipText = this.model.tour.getSkipLabel();
            this.model.tour.entry.content.set('skipText', skipText);
            this.children.skipText = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'skipText',
                    model: this.model.tour.entry.content,
                    placeholder: _('Optional').t(),
                },
                label: _('Skip button text').t(),
            });

            const doneText = this.model.tour.getDoneLabel();
            this.model.tour.entry.content.set('doneText', doneText);
            this.children.doneText = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'doneText',
                    model: this.model.tour.entry.content,
                    placeholder: _('Optional').t(),
                },
                label: _('Done button text').t(),
            });

            const doneURL = this.model.tour.getDoneURL();
            this.model.tour.entry.content.set('doneURL', doneURL);
            this.children.doneURL = new ControlGroup({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'doneURL',
                    model: this.model.tour.entry.content,
                    placeholder: _('ex) /app/search/reports').t(),
                },
                label: _('Done link URL').t(),
            });

            this.activate({ deep: true });
        }

        startListening() {
            this.listenTo(this.model.tour, 'sync', () => {
                this.imageTotal = this.model.tour.getImageTotal();
                this.nextImg = this.imageTotal + 1;
                this.debouncedRender();
            });
        }

        events() {
            return {
                'click .img-back': 'back',
                'click .save': 'update',
                'click .add-image': 'addImage',
                'click .edit-img': 'editImage',
                'click .remove-img': 'removeImage',
                'click .reorder': 'enableReorder',
                'click .stop-reorder': 'stopReorder',
                'click .edit-label': 'editLabel',
            }
        }

        back(e) {
            e.preventDefault();
            this.trigger('back');
        }

        update() {
            this.$('.message').hide();

            this.model.tour.save()
            .done(() => {
                this.saved = true;
            }).fail(() => {
                this.showError('Error saving form');
            });
        }

        successfulSave() {
            this.$('.success-box').fadeIn(500, () => {
                setTimeout(() => {
                    this.$('.success-box').fadeOut(500);
                }, 500);
            });
        }

        showError(errorText = 'An error occurred.') {
            $('.error-box').text(errorText).fadeIn(500);
        }

        addImage(e) {
            e.preventDefault();

            this.children.newImage = new NewImageDialog({
                model: this.model,
                imgNum: this.nextImg,
            });
            this.children.newImage.render().appendTo($('body')).show();
        }

        editImage(e) {
            e.preventDefault();

            this.children.newImage = new NewImageDialog({
                model: this.model,
                imgNum: $(e.currentTarget).parents('.image-container').data('order'),
                isEdit: true,
            })
            this.children.newImage.render().appendTo($('body')).show();
        }

        removeImage(e) {
            e.preventDefault();

            const curImageOrder = $(e.currentTarget).parents('.image-container').data('order');
            const imageTotal = this.model.tour.getImageTotal();

            for (let i = curImageOrder; i < imageTotal + 1; i++) {
                if (i == imageTotal) {
                    this.model.tour.entry.content.unset('imageName' + i);
                    this.model.tour.entry.content.unset('imageCaption' + i);
                } else {
                    this._doTheTimeWarp(i);
                }
            }

            // Here we have to clone, destroy, and recreate the tour
            // to preserve the integrity of how attributes are set.
            const newModel = this.model.tour.clone();
            newModel.unset('id');
            newModel.entry.content.set({
                name: newModel.entry.get('name'),
            });

            this.model.tour.destroy({ silent: true })
                .done(() => {
                    this.model.tour = newModel;
                    this.model.tour.save({}, {
                        data: {
                            app: 'tour_makr',
                            owner: 'nobody',
                        }
                    }).done(() => {
                        this.startListening();
                    });
                });
        }

        _doTheTimeWarp(i) {
            const newFilename = this.model.tour.entry.content.get('imageName' + (i + 1));
            const newCaption = this.model.tour.entry.content.get('imageCaption' + (i + 1));

            this.model.tour.entry.content.set('imageName' + i, newFilename);
            this.model.tour.entry.content.set('imageCaption' + i, newCaption);
        }

        editLabel(e) {
            e.preventDefault();

            this.children.editLabel = new EditLabelDialog({
                model: this.model,
            });
            this.children.editLabel.render().appendTo($('body')).show();
        }

        resetModelOrder() {
            const $elementList = $('.image-container');
            const imageTotal = $elementList.length;
            const tourContent = this.model.tour.entry.content;
            const newModelAttrs = {};

            for (let i = 0; i < imageTotal; i++) {
                const $curEl = $($elementList[i]);
                const curImageName = $curEl.data('filename');
                const curCaption = $curEl.find('.image-caption').text();
                const curOrder = i + 1;

                tourContent.set('imageName' + curOrder, curImageName);
                tourContent.set('imageCaption' + curOrder, curCaption);
                $curEl.data('order', curOrder);
            };

            this.model.tour.save();
            this.checkReorder();
        }

        enableReorder(e) {
            e.preventDefault();

            const sortableOptions = {
                tolerance: 'pointer',
                items: '.image-tile',
                scroll: false,
                delay: 5,
                helper: 'clone',
                appendTo: 'body',
                placeholder: 'image-tile-placeholder',
                opacity: 0.5,
                stop: (event, ui) => {
                    // On Stop callback
                }
            };

            $('.tour-images').sortable(sortableOptions)
                .sortable('enable')
                .toggleClass('sorting');
            $('.stop-reorder').fadeIn(500);
            $('.add-image').fadeOut(500);
            $('.reorder-backdrop').toggleClass('in')
                .toggleClass('out')
                .show();
        }

        stopReorder(e) {
            e.preventDefault();

            $('.tour-images').sortable('disable').toggleClass('sorting');
            $('.stop-reorder').hide();
            $('.add-image').fadeIn(500);
            $('.reorder-backdrop').fadeOut();

            setTimeout(() => {
                this.resetModelOrder();
            }, 650);
        }

        checkReorder() {
            const imageTotal = this.model.tour.getImageTotal();
            if (imageTotal > 1) {
                this.$('.tour-button.reorder').removeAttr('disabled');
            } else {
                this.$('.tour-button.reorder').attr('disabled', 'disabled');
            }
        }

        renderTiles() {
            if (this.model.tour.getImageTotal() > 0) {
                for (let i = 1; i < this.imageTotal + 1; i++) {
                    const imageName = this.model.tour.getImageName(i);
                    const imageCaption = this.model.tour.getImageCaption(i);
                    const imageOrder = i;
                    const newItem = new ImageItem({
                        imageName: imageName,
                        imageCaption: imageCaption,
                        imageOrder: imageOrder,
                        tourName: this.tourName,
                    });

                    this.$('.tour-images').append(newItem.render().el);
                }
            }
        }

        render() {
            this.$el.html(_.template(this.templateMain(), {
                label: Utils.makeTourLabel(this.model.tour),
                tourName: this.tourName
            }));

            this.renderTiles();

            this.$('.extra-attrs').append(this.children.skipText.render().el);
            this.$('.extra-attrs').append(this.children.doneText.render().el);
            this.$('.extra-attrs').append(this.children.doneURL.render().el);
            this.$('.extra-attrs').append(this.children.forceTour.render().el);

            $('<button class="tour-button save">Update</button>').appendTo(this.$('.extra-attrs'));

            this.$('.tour-images').append(this.addTemplate());
            $('.header-extra').text(` / ${_('Edit Tour').t()}`);

            if (this.saved) {
                this.successfulSave();
                this.saved = false;
            }
            this.checkReorder();
            return this;
        }

        templateMain() {
            return `
                <div class="section-padded section-header">
                    <h2 class="section-title"><%- label %> <a href="#" class="edit-label"><%- _('edit label').t() %></a></h2>
                    <p><%- _('Tour ID').t() %>: <%- tourName %></p>
                    <button class="button tour-button img-back">< <%- _('Back').t() %></button>
                    <button class="button tour-button reorder"><%- _('Reorder Slides').t() %></button>
                    <div class="tour-images">
                        <button class="button tour-button stop-reorder"><%- _('Finish Reorder').t() %></button>
                    </div>
                    <div class="extra-attrs form-horizontal">
                        <div class="error-box message"></div>
                    </div>
                    <div class="success-box message"><%- _('Successful Save').t() %></div>
                    <div class="modal-backdrop fade out reorder-backdrop" style="display:none"></div>
                </div>
            `;
        }

        addTemplate() {
            return `
                <div class="add-image">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" width="75px" height="75px" viewBox="0 0 36 36" version="1.1">
                        <g>
                            <path d="M17,17 L17,0 L19,0 L19,17 L36,17 L36,19 L19,19 L19,36 L17,36 L17,19 L0,19 L1.2246468e-16,17 L17,17 Z"></path>
                        </g>
                    </svg>
                    <p class="add-image-text">Add Slide</p>
                </div>
            `;
        }
    }
});