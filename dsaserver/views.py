from pyramid.view import view_config
from pyramid.response import Response
from .backend import master_controller
from .backend import util

# @view_config(route_name='home', renderer='templates/mytemplate.pt')
# def my_view(request):
#     return {'project': 'DSAServer'}


@view_config(route_name='index', renderer='dsaserver:templates/main.pt')
def my_view(request):
    return {}


@view_config(route_name='getFolderHierarchy', renderer='json')
def get_folder_hierarchy(request):
    try:

        root = master_controller.Folder.get_folder_hierarchy()

        return root

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='getFilesInFolder', renderer='json')
def get_files_in_folder(request):
    try:
        id = int(request.params["id"])

        files = [file for file in master_controller.File.get_files() if file.folder_id == id]

        request.response.status = "200 OK"
        return files

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='getLostFilesInFolder', renderer='json')
def get_lost_files_in_folder(request):
    try:
        id = int(request.params["id"])

        files = [file for file in master_controller.File.get_lost_files() if file.folder_id == id]

        request.response.status = "200 OK"
        return files

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='newFolder', renderer='json')
def new_folder(request):
    try:
        json = request.json_body
        name = json["name"]
        parent_id = int(json["parent_id"])

        folder = master_controller.Folder()
        folder.name = name
        folder.parent_id = parent_id

        master_controller.Folder.insert_folder(folder)

        request.response.status = "200 OK"
        return {'id': folder.id}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='deleteFolder', renderer='json')
def delete_folder(request):
    try:
        json = request.json_body
        id = int(json["id"])

        files = [x for x in master_controller.File.get_files() if x.folder_id == id]

        for file in files:
            master_controller.instance.delete_file(file.id)

        master_controller.Folder.delete_folder(master_controller.Folder.get_folder(id))

        request.response.status = "200 OK"
        return {}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='renameFolder', renderer='json')
def rename_folder(request):
    try:
        json = request.json_body
        name = json["name"]
        id = int(json["id"])

        folder = master_controller.Folder.get_folder(id)
        folder.name = name

        master_controller.Folder.update_folder_name(folder)

        request.response.status = "200 OK"
        return {}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='moveFolder', renderer='json')
def move_folder(request):
    try:
        json = request.json_body
        id = int(json["id"])
        parent_id = int(json["parent_id"])

        folder = master_controller.Folder.get_folder(id)
        parent = master_controller.Folder.get_folder(parent_id)

        master_controller.Folder.update_folder_parent(folder, parent)

        request.response.status = "200 OK"
        return {}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='getFileList', renderer='json')
def get_file_list(request):
    return master_controller.File.get_files()


@view_config(route_name='downloadFile')
def download_file(request):
    response = Response(content_type="application/octet-stream", charset=request.charset)

    try:
        id = int(request.params["id"])

        # get the file and contents
        file = master_controller.File.get_file(id)
        file_contents = master_controller.instance.download_file(id)

        if file_contents is None:
            raise FileExistsError("File not found")

        # write the contents as the response
        response.body_file.write(bytes(file_contents))
        # set the file's name
        response.content_disposition = "inline; filename=" + file.name

        response.status = "200 OK"

    except Exception as e:
        response = Response(str(e))
        response.status_int = 500

    return response


@view_config(route_name='deleteFile', renderer="json")
def delete_file(request):
    try:
        json = request.json_body
        id = int(json["id"])

        master_controller.instance.delete_file(id)

        request.response.status = "200 OK"
        return {}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='moveFile', renderer="json")
def move_file(request):
    try:
        json = request.json_body
        id = int(json["id"])
        folder_id = int(json["folder_id"])

        file = master_controller.File.get_file(id)
        file.folder_id = folder_id

        master_controller.File.update_file(file)

        request.response.status = "200 OK"
        return {}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


def get_formdata_value(body, param, charset):
    # find the given parameter
    pat = bytes("name=\"" + param + "\"", charset)
    i_param = body.find(pat)
    # get the contents of the file
    pat = bytes("\r\n\r\n", charset)
    pat_end = bytes("\r\n------WebKitFormBoundary", charset)

    i_start = body.find(pat, i_param)
    i_end = body.find(pat_end, i_param)

    if i_end != -1 and i_end != i_start:
        return body[i_start + len(pat): i_end]
    else:
        return None


@view_config(route_name="uploadFile", renderer="json")
def upload_file(request):
    try:
        body = request.body

        # get the name of the file
        pat = bytes("filename=\"", encoding=request.charset)
        pat_end = bytes("\"", encoding=request.charset)
        i_start = body.find(pat)
        i_end = body.find(pat_end, i_start + len(pat))

        name = body[i_start + len(pat):i_end].decode(request.charset)

        # file location
        folder_id = int(get_formdata_value(body, "folder_id", request.charset).decode(request.charset))

        # get the contents of the file
        file = get_formdata_value(body, "file", request.charset)

        barray = bytearray()
        for b in file:
            barray.append(b)

        file_obj = master_controller.instance.upload_file(name, barray, folder_id=folder_id)

        if file_obj is not None:
            return file_obj
        else:
            raise Exception("Unable to upload file")

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='renameFile', renderer='json')
def rename_file(request):
    try:
        json = request.json_body
        name = json["name"]
        id = int(json["id"])

        file = master_controller.File.get_file(id)
        file.name = name

        master_controller.File.update_file(file)

        request.response.status = "200 OK"
        return {}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name='searchFiles', renderer='json')
def search_files(request):
    try:
        query = request.params["query"]

        if request.params["in_contents"] == "true":
            files = master_controller.instance.search_files(util.s_to_bytes(query))
        else:
            files = [file for file in master_controller.File.get_files() if file.name.find(query) != -1]

        request.response.status = "200 OK"
        return files

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name="getSpaceAvailable", renderer="json")
def get_space_available(request):
    try:
        return {'space': master_controller.instance.get_total_space_available()}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}


@view_config(route_name="getTotalSpace", renderer="json")
def get_total_size(request):
    try:
        return {'space': master_controller.instance.get_total_size()}

    except Exception as e:
        request.response.status = 500
        return {'errors': str(e)}