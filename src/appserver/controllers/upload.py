import cherrypy
import os
import imghdr
import ntpath

import splunk.appserver.mrsparkle.controllers as controllers
from splunk.appserver.mrsparkle.lib.decorators import expose_page
from splunk.appserver.mrsparkle.lib.routes import route
from splunk.appserver.mrsparkle.lib import util
from shutil import copyfileobj

class UploadController(controllers.BaseController):

    ALLOWED_FILE_TYPES = ['gif', 'jpeg', 'bmp', 'png']

    def isDirTraversing(self, path_part):
        """
        Ensure that the parameter provided doesn't include any pathing information.
        """
    
        if path_part.find('/')>-1 or path_part.find('\\')>-1 or path_part.find('..')>-1 or path_part.startswith('.') or self.cleanPath(path_part) == '':
            return True
        else:
            return False

    def cleanPath(self, path_part):
        """
        Clean paths such that any path traversal characters are removed (.., /, etc.). This does this by just
        returning the base file name (with any paths stripped). ntpath is being used since it works with Windows too.

        Note that this function will return an empty string if the path ends in a slash (since no file name exists).
        """

        return ntpath.basename(path_part)

    @route('/', methods=['POST','GET'])
    @expose_page(must_login=True,verify_session=False)
    def upload(self, **kargs):
        if cherrypy.request.method == 'GET':
            return self.render_template('upload_image:upload.html', {})

        image = kargs.get('image', None)
        tour_name = kargs.get('tourName', None)
        filename = kargs.get('filename', None)
        app = 'tour_makr' # This is hard-coded in order prevent the upload of files into arbitrary apps

        # Get the file extension
        file_extension = os.path.splitext(filename)[1][1:]

        # Make sure the file is an actual image and one that we accept
        # Note that files that are not image files at all will return None
        if imghdr.what(image.file) not in UploadController.ALLOWED_FILE_TYPES or file_extension not in UploadController.ALLOWED_FILE_TYPES:
            raise cherrypy.HTTPError(403, 'The type of file is not allowed; must be gif, jpeg, bmp, or png')

        if image is not None :
            try:

                # Verify that the app name doesn't attempt a path traversal attack
                if self.isDirTraversing(app):
                    return 'App name cannot contain / or \\ character or start with . app="%s"' % app

                # Verify that the tour name doesn't attempt a path traversal attack
                if self.isDirTraversing(tour_name):
                    return 'Tour name cannot contain / or \\ character or start with . tour_name="%s"' % tour_name

                tempPath = util.make_splunkhome_path(['etc', 'apps', self.cleanPath(app), 'appserver', 'static', 'img', self.cleanPath(tour_name)])
                if not os.path.exists(tempPath):
                    os.makedirs(tempPath)

                # Verify that the filename doesn't attempt a path traversal attack
                if self.isDirTraversing(filename):
                    return 'Filename cannot contain / or \\ character or start with . filename="%s"' % filename

                newPath = os.path.join(tempPath, self.cleanPath(filename))
                with open(newPath, 'wb') as newFile:
                    copyfileobj(image.file,newFile)

                return "Successfully stored %s" % filename
            except Exception, e:
                #raise cherrypy.HTTPError(200, 'Failed to upload the file %s. Exception %s' % (filename, str(e)))
                return 'Failed to upload the file %s. Exception %s' % (filename, str(e))
        else:
            raise cherrypy.HTTPError(400, 'No image provided.')