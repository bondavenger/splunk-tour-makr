define(() => {
    const Utils = {
        makeTourLabel: tourModel => {
            if (tourModel.getLabel()) {
                return tourModel.getLabel();
            } else {
                const name = tourModel.entry.get('name');
                const splitString = (name.indexOf('-') > -1) ? '-' : '_';
                const names = name.split(splitString);
                names.forEach((name, index) => {
                    const capName = name.charAt(0).toUpperCase() + name.substring(1);
                    names[index] = capName
                });

                return names.join(' ');
            }
        },

        createTourName: label => {
            return (label) ? label.split(' ').join('-').replace(/[&'",?!/\\]+/g, '').toLowerCase() : '';
        },
    }

    return Utils;
});